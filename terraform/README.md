# Terraform Infrastructure for School Safety App

This directory contains Terraform configuration for deploying the School Safety App infrastructure to AWS.

## ⚠️ Important Notice

**This is for advanced users only!** If you're a Product Manager with no technical experience, please use the AWS Console method instead:
- See: `QUICK_START_AWS.md` for step-by-step console instructions
- See: `DEPLOYMENT_GUIDE.md` for comprehensive deployment guide

## What This Does

This Terraform configuration creates:
- RDS PostgreSQL database (encrypted, with backups)
- S3 bucket for file uploads (with versioning and CORS)
- IAM roles and policies
- Security groups
- CloudWatch monitoring

**Note**: This does NOT deploy the application code. You still need to:
1. Deploy backend to Elastic Beanstalk manually
2. Deploy PWA to AWS Amplify manually

## Prerequisites

1. **Terraform installed** (v1.0+)
   ```bash
   brew install terraform  # macOS
   # or download from terraform.io
   ```

2. **AWS CLI configured**
   ```bash
   aws configure
   ```

3. **AWS credentials** with admin access

## Usage

### 1. Create Variables File

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and fill in your values:
- `db_password`: Strong password for database
- `github_token`: GitHub personal access token
- Other settings as needed

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Preview Changes

```bash
terraform plan
```

Review the changes that will be made to your AWS account.

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted.

### 5. Save Outputs

After successful apply, save the outputs:

```bash
terraform output -json > outputs.json
```

Important outputs:
- `database_endpoint`: Use this in your `DATABASE_URL`
- `s3_bucket_name`: Use this in your `S3_BUCKET` env var
- `backend_instance_profile_arn`: Use this when creating Elastic Beanstalk

## Configuration

### Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region | us-east-1 | No |
| `project_name` | Project name | school-safety | No |
| `environment` | Environment | production | No |
| `db_password` | Database password | - | Yes |
| `github_repo` | GitHub repository | jatinbhagat/school-safety-app | No |
| `github_token` | GitHub token | - | Yes |

### Customization

For production deployments, consider these changes in `main.tf`:

1. **Database**:
   - Change `instance_class` to `db.t3.small` or larger
   - Set `multi_az = true` for high availability
   - Set `deletion_protection = true`
   - Set `skip_final_snapshot = false`

2. **Network**:
   - Create a custom VPC instead of using default
   - Set `publicly_accessible = false` for RDS
   - Use private subnets for database

3. **Security**:
   - Restrict CORS origins to your actual domain
   - Use AWS Secrets Manager for passwords
   - Enable encryption everywhere

## After Terraform Apply

You still need to:

1. **Deploy Backend**:
   - Create Elastic Beanstalk application
   - Upload backend code
   - Set environment variables (use Terraform outputs)

2. **Deploy Frontend**:
   - Create Amplify app
   - Connect GitHub repository
   - Set environment variables

3. **Initialize Database**:
   ```bash
   # Connect to RDS
   psql -h <database_endpoint> -U postgres -d school_safety

   # Run migrations or schema setup
   ```

## Costs

Estimated monthly costs (after free tier):

| Resource | Size | Cost/Month |
|----------|------|------------|
| RDS (db.t3.micro) | 20GB | $15-20 |
| RDS (db.t3.small) | 20GB | $25-30 |
| S3 | 10GB | $1-3 |
| Data Transfer | 10GB | $1-2 |
| **Total** | | **$17-35** |

**Note**: Does not include Elastic Beanstalk EC2 costs ($15-30/month) or Amplify ($5-15/month)

## Destroying Infrastructure

**WARNING**: This will delete all data!

```bash
terraform destroy
```

Before destroying:
1. Export any important data
2. Download database backups
3. Save S3 files locally

## Terraform State

Terraform stores state locally in `terraform.tfstate`. This file contains sensitive information!

**Best Practices**:

1. **Never commit `terraform.tfstate` to git**
2. **Use remote state** (recommended for production):
   ```hcl
   terraform {
     backend "s3" {
       bucket = "school-safety-terraform-state"
       key    = "production/terraform.tfstate"
       region = "us-east-1"
     }
   }
   ```

3. **Enable state locking** with DynamoDB:
   ```hcl
   terraform {
     backend "s3" {
       bucket         = "school-safety-terraform-state"
       key            = "production/terraform.tfstate"
       region         = "us-east-1"
       dynamodb_table = "terraform-state-lock"
       encrypt        = true
     }
   }
   ```

## Troubleshooting

### Error: "Credential should be scoped to a valid region"
**Solution**: Check your AWS region in `terraform.tfvars`

### Error: "DBInstanceIdentifier already exists"
**Solution**: Choose a different `project_name` or delete the existing RDS instance

### Error: "Bucket already exists"
**Solution**: S3 bucket names must be globally unique. Change the bucket name in variables.

### Error: "Insufficient permissions"
**Solution**: Ensure your AWS credentials have admin access or required permissions

## Security Checklist

Before going to production:

- [ ] Use strong database password (20+ characters)
- [ ] Enable deletion protection on RDS
- [ ] Set up private VPC with subnets
- [ ] Use Secrets Manager for sensitive values
- [ ] Enable MFA on AWS account
- [ ] Set up billing alerts
- [ ] Enable CloudTrail for audit logs
- [ ] Configure backup retention (30+ days)
- [ ] Use SSL/TLS for database connections
- [ ] Restrict S3 CORS to specific domains

## Support

- Terraform Documentation: [terraform.io/docs](https://terraform.io/docs)
- AWS Provider Docs: [registry.terraform.io/providers/hashicorp/aws](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- HashiCorp Community: [discuss.hashicorp.com](https://discuss.hashicorp.com/)

## License

Same as main project
