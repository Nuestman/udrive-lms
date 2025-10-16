-- =============================================
-- CERTIFICATES SCHEMA FIX - SUPABASE VERSION
-- Fixes missing fields and tenant isolation
-- =============================================

-- 1. Add missing columns to certificates table
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS student_name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS course_name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS instructor_name TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create index on enrollment_id for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment_id ON certificates(enrollment_id);

-- 3. Add tenant_id to certificates for proper tenant isolation
-- This will be populated through the course relationship
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 4. Update tenant_id from courses table
UPDATE certificates 
SET tenant_id = c.tenant_id
FROM courses c
WHERE certificates.course_id = c.id;

-- 5. Add foreign key constraint for tenant_id
ALTER TABLE certificates 
ADD CONSTRAINT certificates_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. Create index on tenant_id for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_id ON certificates(tenant_id);

-- 7. Add verification code if not exists (for public verification)
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE;

-- 8. Generate verification codes for existing certificates
UPDATE certificates 
SET verification_code = 'VERIFY-' || UPPER(SUBSTRING(id::text, 1, 8)) || '-' || UPPER(SUBSTRING(certificate_number, -8))
WHERE verification_code IS NULL;

-- 9. Make verification_code NOT NULL after populating
ALTER TABLE certificates 
ALTER COLUMN verification_code SET NOT NULL;

-- 10. Add certificate template/design metadata
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS design_data JSONB DEFAULT '{}';

-- 11. Add approval workflow fields
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- 12. Add revocation fields
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revocation_reason TEXT;

-- 13. Create composite index for tenant + student queries
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_student ON certificates(tenant_id, student_id);

-- 14. Create composite index for tenant + course queries  
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_course ON certificates(tenant_id, course_id);

-- 15. Create view for certificate verification (public access)
CREATE OR REPLACE VIEW certificate_verification AS
SELECT 
    c.id,
    c.certificate_number,
    c.verification_code,
    c.student_name,
    c.course_name,
    c.school_name,
    c.issued_at,
    c.status,
    t.name as tenant_name
FROM certificates c
JOIN tenants t ON c.tenant_id = t.id
WHERE c.status = 'active';

-- 16. Grant public access to verification view
GRANT SELECT ON certificate_verification TO anon;

-- 17. Create function to verify certificate
CREATE OR REPLACE FUNCTION verify_certificate(verification_code_param TEXT)
RETURNS TABLE (
    id UUID,
    certificate_number TEXT,
    student_name TEXT,
    course_name TEXT,
    school_name TEXT,
    issued_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.certificate_number,
        c.student_name,
        c.course_name,
        c.school_name,
        c.issued_at,
        c.status,
        (c.status = 'active') as is_valid
    FROM certificates c
    WHERE c.verification_code = verification_code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Grant execute permission on verification function
GRANT EXECUTE ON FUNCTION verify_certificate(TEXT) TO anon;

-- 19. Enable RLS (Row Level Security) for tenant isolation
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 20. Create RLS policy for tenant isolation (Supabase version)
CREATE POLICY certificates_tenant_isolation ON certificates
    FOR ALL TO authenticated
    USING (
        tenant_id = (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 21. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON certificates TO authenticated;

COMMENT ON TABLE certificates IS 'Certificates issued to students upon course completion with tenant isolation';
COMMENT ON COLUMN certificates.enrollment_id IS 'Reference to the enrollment that generated this certificate';
COMMENT ON COLUMN certificates.tenant_id IS 'Tenant ID for multi-tenant isolation';
COMMENT ON COLUMN certificates.verification_code IS 'Public verification code for certificate authenticity';
COMMENT ON COLUMN certificates.template_id IS 'Certificate template/design identifier';
COMMENT ON COLUMN certificates.design_data IS 'Certificate design customization data';
