
resource "aws_instance" "dynamsoft" {
  ami           = "${var.ami}"
  instance_type = "t2.nano"

  key_name = "dynamsoft"
  availability_zone = "${var.availability_zones[0]}"
  security_groups = ["${aws_security_group.dynamsoft.name}"]

  tags {
    Name        = "dynamsoft-${var.environment}"
    environment = "${var.environment}"
  }

  user_data = "${data.template_file.setup_dynamsoft.rendered}"
}

data "template_file" "setup_dynamsoft" {
  template = "${file("setup_dynamsoft.sh")}"

  vars {
    git_access_token = "${var.git_access_token}"
    product_keys = "${var.product_keys}"
  }
}

resource "aws_security_group" "dynamsoft_load_balancer_security_group" {
  name        = "dynamsoft-load-balancer-${var.environment}"
  description = "dynamsoft-load-balancer-security-group"

  ingress {
    from_port   = "443"
    to_port     = "443"
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags {
    Name        = "dynamsoft-elb-${var.environment}"
    environment = "${var.environment}"
  }
}

resource "aws_security_group" "dynamsoft" {
  name        = "dynamsoft-${var.environment}"
  description = "Allow access to dynamsoft"

  # vpc_id = "${aws_vpc.main.vpc_id}"

  tags {
    Name        = "dynamsoft-${var.environment}"
    environment = "${var.environment}"
  }
}

resource "aws_security_group_rule" "dynamsoft_egress" {
  type        = "egress"
  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = ["0.0.0.0/0"]
  security_group_id = "${aws_security_group.dynamsoft.id}"
}

resource "aws_security_group_rule" "dynamsoft_http_ingress" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  # cidr_blocks = ["0.0.0.0/0"]
  source_security_group_id = "${aws_security_group.dynamsoft_load_balancer_security_group.id}"
  security_group_id        = "${aws_security_group.dynamsoft.id}"
}

resource "aws_security_group_rule" "dynamsoft_ssh_ingress" {
  type                     = "ingress"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  # source_security_group_id = "${aws_security_group.bastion_host_security_group.id}"
  security_group_id        = "${aws_security_group.dynamsoft.id}"
}


resource "aws_elb" "dynamsoft_elb" {
  name            = "dynamsoft-elb-${var.environment}"
  # subnets         = ["${element(aws_vpc.main.public_subnets, 0)}"]
  availability_zones = "${var.availability_zones}"
  security_groups = ["${aws_security_group.dynamsoft_load_balancer_security_group.id}"]

  listener {
    instance_port      = 80
    instance_protocol  = "http"
    lb_port            = 443
    lb_protocol        = "https"
    ssl_certificate_id = "${aws_acm_certificate.this.arn}"
  }

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    target              = "HTTP:80/"
    interval            = 30
  }

  instances                   = ["${aws_instance.dynamsoft.id}"]
  cross_zone_load_balancing   = false
  idle_timeout                = 400
  connection_draining         = true
  connection_draining_timeout = 400

  tags {
    Name        = "dynamsoft-elb-${var.environment}"
    environment = "${var.environment}"
  }
}

data "aws_route53_zone" "zone" {
  name = "${var.dns_domain}."
}


resource "aws_acm_certificate" "this" {
  domain_name       = "dynamsoft-${var.environment}.${var.dns_domain}"
  validation_method = "DNS"

  tags = {
    Name          = "dynamsoft-${var.environment}.${var.dns_domain}"
    ProductDomain = "EFCMS"
    Environment   = "${var.environment}"
    Description   = "Certificate for dynamsoft-${var.environment}.${var.dns_domain}"
    ManagedBy     = "terraform"
  }
}

# resource "aws_route53_record" "this" {
#   name    = "${aws_acm_certificate.this.domain_validation_options.0.resource_record_name}"
#   type    = "${aws_acm_certificate.this.domain_validation_options.0.resource_record_type}"
#   zone_id = "${data.aws_route53_zone.zone.zone_id}"
#   records = ["${aws_acm_certificate.this.domain_validation_options.0.resource_record_value}"]
#   ttl     = 60
# }

# resource "aws_acm_certificate_validation" "dns_validation" {
#   certificate_arn         = "${aws_acm_certificate.this.arn}"
#   validation_record_fqdns = ["${aws_route53_record.this.fqdn}"]
# }


# module "dynamsoft-certificate" {
#   source = "github.com/traveloka/terraform-aws-acm-certificate?ref=v0.1.2"
#   domain_name            = "dynamsoft-${var.environment}.${var.dns_domain}"
#   hosted_zone_name       = "${var.dns_domain}."
#   is_hosted_zone_private = "false"
#   validation_method      = "DNS"
#   certificate_name       = "dynamsoft-${var.environment}.${var.dns_domain}"
#   environment            = "${var.environment}"
#   description            = "Certificate for dynamsoft-${var.environment}.${var.dns_domain}"
#   product_domain         = "EFCMS"
# }