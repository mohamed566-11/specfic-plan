<?php
require_once __DIR__ . '/config.php';

// Override content type for CSV
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="strategic_plan_requests_' . date('Y-m-d_His') . '.csv"');
header('Cache-Control: no-cache, no-store, must-revalidate');

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->query("SELECT * FROM strategic_plan_requests ORDER BY created_at DESC");
    $records = $stmt->fetchAll();
    
    if (empty($records)) {
        echo "No data available";
        exit();
    }
    
    // BOM for Excel Arabic support
    echo "\xEF\xBB\xBF";
    
    $output = fopen('php://output', 'w');
    
    // CSV headers (bilingual)
    $headers = [
        'ID',
        'Company Name / الاسم التجاري',
        'Sector / القطاع',
        'Founded Year / سنة التأسيس',
        'Country/City / الدولة/المدينة',
        'Website / الموقع الإلكتروني',
        'Branch Count / عدد الفروع',
        'Employee Count / عدد الموظفين',
        'Applicant Name / اسم مقدم الطلب',
        'Job Title / المسمى الوظيفي',
        'Mobile / الجوال',
        'Email / البريد الإلكتروني',
        'Request Reasons / أهداف الطلب',
        'Other Request Reason / سبب آخر',
        'Challenge Description / وصف التحدي',
        'Challenges / التحديات',
        'Strengths / نقاط القوة',
        'Scope Options / نطاق الخطة',
        'Other Scope / نطاق آخر',
        'Current Clients / العملاء الحاليون',
        'Client Segments / شرائح العملاء',
        'Current Regions / المناطق الحالية',
        'Target Markets / الأسواق المستهدفة',
        'Competitors / المنافسون',
        'Annual Revenue / الإيرادات السنوية',
        'Growth Rate / نسبة النمو',
        'Profit Margin / هامش الربحية',
        'Expected Outputs / المخرجات المتوقعة',
        'Other Expected Output / مخرجات أخرى',
        'Proposed Start Date / تاريخ البدء',
        'Urgency / السرعة',
        'Attachment Types / أنواع المرفقات',
        'File URLs / روابط الملفات',
        'Created At / تاريخ الإنشاء',
    ];
    
    fputcsv($output, $headers);
    
    // JSON fields that need to be joined as text
    $jsonFields = ['request_reasons', 'challenges', 'strengths', 'scope_options', 
                   'competitors', 'expected_outputs', 'attachment_types', 'file_urls'];
    
    foreach ($records as $row) {
        // Convert JSON arrays to readable strings
        foreach ($jsonFields as $field) {
            if (isset($row[$field])) {
                $decoded = json_decode($row[$field], true);
                if (is_array($decoded)) {
                    $row[$field] = implode(' | ', array_filter($decoded));
                }
            }
        }
        
        fputcsv($output, [
            $row['id'],
            $row['company_name'],
            $row['sector'],
            $row['founded_year'],
            $row['country_city'],
            $row['website'],
            $row['branch_count'],
            $row['employee_count'],
            $row['applicant_name'],
            $row['job_title'],
            $row['mobile'],
            $row['email'],
            $row['request_reasons'],
            $row['other_request_reason'],
            $row['challenge_description'],
            $row['challenges'],
            $row['strengths'],
            $row['scope_options'],
            $row['other_scope_option'],
            $row['current_clients'],
            $row['client_segments'],
            $row['current_regions'],
            $row['target_markets'],
            $row['competitors'],
            $row['annual_revenue'],
            $row['growth_rate'],
            $row['profit_margin'],
            $row['expected_outputs'],
            $row['other_expected_output'],
            $row['proposed_start_date'],
            $row['urgency'],
            $row['attachment_types'],
            $row['file_urls'],
            $row['created_at'],
        ]);
    }
    
    fclose($output);
    
} catch (Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
