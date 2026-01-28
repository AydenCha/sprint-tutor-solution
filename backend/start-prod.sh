#!/bin/bash

# Production 프로필로 백엔드 실행 스크립트
# dev mode가 막혔을 때 운영 DB에 연결하여 실행

echo "==================================="
echo "Production 프로필로 백엔드 실행"
echo "==================================="
echo ""

# 환경 변수 확인
if [ -z "$DATABASE_URL" ] && [ -z "$DATABASE_USERNAME" ]; then
    echo "⚠️  경고: DATABASE_URL 또는 DATABASE_USERNAME이 설정되지 않았습니다."
    echo ""
    echo "운영 DB 연결 정보를 환경 변수로 설정해주세요:"
    echo ""
    echo "export DATABASE_URL=jdbc:postgresql://<HOST>:<PORT>/<DB_NAME>"
    echo "export DATABASE_USERNAME=<USERNAME>"
    echo "export DATABASE_PASSWORD=<PASSWORD>"
    echo "export JWT_SECRET=<YOUR_JWT_SECRET>"
    echo "export SPRING_PROFILES_ACTIVE=prod"
    echo ""
    echo "또는 .env 파일을 생성하여 설정할 수 있습니다."
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Production 프로필로 실행
echo "Production 프로필로 Spring Boot 애플리케이션을 시작합니다..."
echo "API: http://localhost:8080/api"
echo ""

SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
