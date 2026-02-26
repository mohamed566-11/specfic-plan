<?php
require_once __DIR__ . '/config.php';

// Accept DELETE method
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$id = $_GET['id'] ?? null;

if (!$id || !is_numeric($id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid ID']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // First, get file URLs to clean up uploaded files
    $stmt = $pdo->prepare("SELECT file_urls FROM strategic_plan_requests WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $record = $stmt->fetch();
    
    if (!$record) {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        exit();
    }
    
    // Delete uploaded files if any
    if (!empty($record['file_urls'])) {
        $fileUrls = json_decode($record['file_urls'], true);
        if (is_array($fileUrls)) {
            foreach ($fileUrls as $url) {
                // Extract filename from URL
                $fileName = basename(parse_url($url, PHP_URL_PATH));
                $filePath = __DIR__ . '/uploads/' . $fileName;
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
        }
    }
    
    // Delete the record
    $stmt = $pdo->prepare("DELETE FROM strategic_plan_requests WHERE id = :id");
    $stmt->execute([':id' => $id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Record deleted successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found or already deleted']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
