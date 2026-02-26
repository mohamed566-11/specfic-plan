-- MySQL setup for strategic_plan_requests table
-- Database: specific-plan

CREATE TABLE IF NOT EXISTS strategic_plan_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Step 1: Company Data
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(255) DEFAULT NULL,
    founded_year VARCHAR(50) DEFAULT NULL,
    country_city VARCHAR(255) DEFAULT NULL,
    website VARCHAR(500) DEFAULT NULL,
    branch_count VARCHAR(100) DEFAULT NULL,
    employee_count VARCHAR(100) DEFAULT NULL,
    applicant_name VARCHAR(255) DEFAULT NULL,
    job_title VARCHAR(255) DEFAULT NULL,
    mobile VARCHAR(50) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    
    -- Step 2: Reason for Request
    request_reasons JSON DEFAULT NULL,
    other_request_reason TEXT DEFAULT NULL,
    challenge_description TEXT DEFAULT NULL,
    
    -- Step 3: Current Situation
    challenges JSON DEFAULT NULL,
    strengths JSON DEFAULT NULL,
    
    -- Step 4: Vision, Mission, Values
    current_vision TEXT DEFAULT NULL,
    current_mission TEXT DEFAULT NULL,
    current_values TEXT DEFAULT NULL,
    vision_action VARCHAR(255) DEFAULT NULL,
    
    -- Step 5: Scope
    scope_options JSON DEFAULT NULL,
    other_scope_option TEXT DEFAULT NULL,
    
    -- Step 6: Markets & Clients
    current_clients TEXT DEFAULT NULL,
    client_segments TEXT DEFAULT NULL,
    current_regions TEXT DEFAULT NULL,
    target_markets TEXT DEFAULT NULL,
    competitors JSON DEFAULT NULL,
    
    -- Step 7: Products/Services
    current_products JSON DEFAULT NULL,
    planned_products JSON DEFAULT NULL,
    
    -- Step 8: Performance
    annual_revenue VARCHAR(255) DEFAULT NULL,
    growth_rate VARCHAR(100) DEFAULT NULL,
    profit_margin VARCHAR(100) DEFAULT NULL,
    
    -- Step 9: Resources
    resources JSON DEFAULT NULL,
    other_resource TEXT DEFAULT NULL,
    
    -- Step 10: Stakeholders
    ceo VARCHAR(255) DEFAULT NULL,
    strategy_director VARCHAR(255) DEFAULT NULL,
    finance_director VARCHAR(255) DEFAULT NULL,
    hr_director VARCHAR(255) DEFAULT NULL,
    ops_director VARCHAR(255) DEFAULT NULL,
    consulting_contact VARCHAR(255) DEFAULT NULL,
    
    -- Step 11: Expected Outputs
    expected_outputs JSON DEFAULT NULL,
    other_expected_output TEXT DEFAULT NULL,
    
    -- Step 12: Timeline
    proposed_start_date DATE DEFAULT NULL,
    urgency VARCHAR(255) DEFAULT NULL,
    
    -- Step 13: Attachments
    attachment_types JSON DEFAULT NULL,
    file_urls JSON DEFAULT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for performance
CREATE INDEX idx_created_at ON strategic_plan_requests(created_at DESC);
CREATE INDEX idx_company_name ON strategic_plan_requests(company_name);
