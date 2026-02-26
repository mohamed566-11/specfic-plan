<?php
require_once __DIR__ . '/config.php';

// Accept GET and POST
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Check if we want a single record
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM strategic_plan_requests WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $record = $stmt->fetch();
        
        if (!$record) {
            http_response_code(404);
            echo json_encode(['error' => 'Record not found']);
            exit();
        }
        
        // Decode JSON fields
        $jsonFields = ['request_reasons', 'challenges', 'strengths', 'scope_options', 
                       'competitors', 'current_products', 'planned_products', 'resources', 
                       'expected_outputs', 'attachment_types', 'file_urls'];
        foreach ($jsonFields as $field) {
            if (isset($record[$field])) {
                $record[$field] = json_decode($record[$field], true);
            }
        }
        
        echo json_encode(['success' => true, 'data' => $record]);
    } else {
        // Get all records with optional search
        $search = $_GET['search'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = max(1, min(100, intval($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;
        
        // Build query
        $where = '';
        $params = [];
        
        if ($search) {
            $where = " WHERE company_name LIKE :search OR applicant_name LIKE :search2 OR email LIKE :search3 OR mobile LIKE :search4 OR sector LIKE :search5";
            $params[':search'] = "%$search%";
            $params[':search2'] = "%$search%";
            $params[':search3'] = "%$search%";
            $params[':search4'] = "%$search%";
            $params[':search5'] = "%$search%";
        }
        
        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM strategic_plan_requests" . $where);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get records
        $sql = "SELECT * FROM strategic_plan_requests" . $where . " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $records = $stmt->fetchAll();
        
        // Decode JSON fields for each record
        $jsonFields = ['request_reasons', 'challenges', 'strengths', 'scope_options', 
                       'competitors', 'current_products', 'planned_products', 'resources', 
                       'expected_outputs', 'attachment_types', 'file_urls'];
        foreach ($records as &$record) {
            foreach ($jsonFields as $field) {
                if (isset($record[$field])) {
                    $record[$field] = json_decode($record[$field], true);
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $records,
            'pagination' => [
                'total' => intval($total),
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage),
            ]
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
