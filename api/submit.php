<?php
require_once __DIR__ . '/config.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Detect content type and parse input accordingly
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'multipart/form-data') !== false) {
        // ── FormData (multipart) upload ──────────────────
        $input = $_POST;
        
        // Decode JSON-encoded array fields
        $jsonFields = ['request_reasons', 'challenges', 'strengths', 'scope_options', 
                       'competitors', 'expected_outputs', 'attachment_types'];
        foreach ($jsonFields as $field) {
            if (isset($input[$field]) && is_string($input[$field])) {
                $decoded = json_decode($input[$field], true);
                $input[$field] = is_array($decoded) ? $decoded : [];
            }
        }
        
        // Handle native file uploads
        $fileUrls = [];
        if (!empty($_FILES['files'])) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            // Handle multiple files (files[])
            $fileCount = is_array($_FILES['files']['name']) ? count($_FILES['files']['name']) : 1;
            
            for ($i = 0; $i < $fileCount; $i++) {
                $tmpName = is_array($_FILES['files']['tmp_name']) ? $_FILES['files']['tmp_name'][$i] : $_FILES['files']['tmp_name'];
                $origName = is_array($_FILES['files']['name']) ? $_FILES['files']['name'][$i] : $_FILES['files']['name'];
                $error = is_array($_FILES['files']['error']) ? $_FILES['files']['error'][$i] : $_FILES['files']['error'];
                
                if ($error === UPLOAD_ERR_OK && is_uploaded_file($tmpName)) {
                    $fileExt = pathinfo($origName, PATHINFO_EXTENSION);
                    $fileName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
                    $filePath = $uploadDir . $fileName;
                    
                    if (move_uploaded_file($tmpName, $filePath)) {
                        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                        $host = $_SERVER['HTTP_HOST'];
                        $baseUrl = $protocol . '://' . $host;
                        $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
                        $fileUrls[] = $baseUrl . $scriptDir . '/uploads/' . $fileName;
                    }
                } elseif ($error !== UPLOAD_ERR_OK && $error !== UPLOAD_ERR_NO_FILE) {
                    // Log file upload errors
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                        UPLOAD_ERR_EXTENSION => 'Upload stopped by extension',
                    ];
                    error_log("File upload error for '$origName': " . ($errorMessages[$error] ?? "Unknown error $error"));
                }
            }
        }
        
    } elseif (strpos($contentType, 'application/json') !== false) {
        // ── JSON input (legacy / backward compatible) ────
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit();
        }
        
        // Handle base64 file uploads (legacy)
        $fileUrls = [];
        if (!empty($input['files'])) {
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            foreach ($input['files'] as $fileData) {
                if (!empty($fileData['data']) && !empty($fileData['name'])) {
                    $fileExt = pathinfo($fileData['name'], PATHINFO_EXTENSION);
                    $fileName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
                    $filePath = $uploadDir . $fileName;
                    
                    $decodedData = base64_decode($fileData['data']);
                    if ($decodedData !== false) {
                        file_put_contents($filePath, $decodedData);
                        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                        $host = $_SERVER['HTTP_HOST'];
                        $baseUrl = $protocol . '://' . $host;
                        $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
                        $fileUrls[] = $baseUrl . $scriptDir . '/uploads/' . $fileName;
                    }
                }
            }
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Unsupported content type']);
        exit();
    }
    
    // Prepare data for insert
    $sql = "INSERT INTO strategic_plan_requests (
        company_name, sector, founded_year, country_city, website,
        branch_count, employee_count, applicant_name, job_title, mobile, email,
        request_reasons, other_request_reason, challenge_description,
        challenges, strengths,
        scope_options, other_scope_option,
        current_clients, client_segments, current_regions, target_markets, competitors,
        annual_revenue, growth_rate, profit_margin,
        expected_outputs, other_expected_output,
        proposed_start_date, urgency,
        attachment_types, file_urls
    ) VALUES (
        :company_name, :sector, :founded_year, :country_city, :website,
        :branch_count, :employee_count, :applicant_name, :job_title, :mobile, :email,
        :request_reasons, :other_request_reason, :challenge_description,
        :challenges, :strengths,
        :scope_options, :other_scope_option,
        :current_clients, :client_segments, :current_regions, :target_markets, :competitors,
        :annual_revenue, :growth_rate, :profit_margin,
        :expected_outputs, :other_expected_output,
        :proposed_start_date, :urgency,
        :attachment_types, :file_urls
    )";
    
    $stmt = $pdo->prepare($sql);
    
    // Helper: get array field as JSON string - filter out empty values
    $getJsonArray = function($field) use ($input) {
        $val = $input[$field] ?? [];
        if (is_string($val)) {
            $val = json_decode($val, true);
        }
        
        if (!is_array($val)) {
            return json_encode([]);
        }
        
        // Filter out empty strings/nulls
        $filtered = array_filter($val, function($item) {
            return $item !== null && $item !== '' && (!is_string($item) || trim($item) !== '');
        });
        
        return json_encode(array_values($filtered));
    };
    
    // Helper: get string field - return null if empty or 'null'/'undefined' strings
    $getStr = function($field) use ($input) {
        if (!isset($input[$field])) return null;
        $val = trim((string)$input[$field]);
        if ($val === '' || $val === 'null' || $val === 'undefined') {
            return null;
        }
        return $val;
    };
    
    // Date needs special treatment: Empty string should be NULL in DB
    $startDate = $getStr('proposed_start_date');
    $startDate = (!empty($startDate)) ? $startDate : null;

    $stmt->execute([
        ':company_name'          => $getStr('company_name') ?? '',
        ':sector'                => $getStr('sector'),
        ':founded_year'          => $getStr('founded_year'),
        ':country_city'          => $getStr('country_city'),
        ':website'               => $getStr('website'),
        ':branch_count'          => $getStr('branch_count'),
        ':employee_count'        => $getStr('employee_count'),
        ':applicant_name'        => $getStr('applicant_name'),
        ':job_title'             => $getStr('job_title'),
        ':mobile'                => $getStr('mobile'),
        ':email'                 => $getStr('email'),
        ':request_reasons'       => $getJsonArray('request_reasons'),
        ':other_request_reason'  => $getStr('other_request_reason'),
        ':challenge_description' => $getStr('challenge_description'),
        ':challenges'            => $getJsonArray('challenges'),
        ':strengths'             => $getJsonArray('strengths'),
        ':scope_options'         => $getJsonArray('scope_options'),
        ':other_scope_option'    => $getStr('other_scope_option'),
        ':current_clients'       => $getStr('current_clients'),
        ':client_segments'       => $getStr('client_segments'),
        ':current_regions'       => $getStr('current_regions'),
        ':target_markets'        => $getStr('target_markets'),
        ':competitors'           => $getJsonArray('competitors'),
        ':annual_revenue'        => $getStr('annual_revenue'),
        ':growth_rate'           => $getStr('growth_rate'),
        ':profit_margin'         => $getStr('profit_margin'),
        ':expected_outputs'      => $getJsonArray('expected_outputs'),
        ':other_expected_output' => $getStr('other_expected_output'),
        ':proposed_start_date'   => $startDate,
        ':urgency'               => $getStr('urgency'),
        ':attachment_types'      => $getJsonArray('attachment_types'),
        ':file_urls'             => json_encode($fileUrls),
    ]);
    
    $insertedId = $pdo->lastInsertId();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Request submitted successfully',
        'id' => $insertedId,
        'files_uploaded' => count($fileUrls),
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
