#!/bin/bash
export DATABASE_URL="postgresql://postgres.twoghyekcodgiijevsrr:Ashish%40603281337259@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
cp /home/z/my-project/prisma/schema.postgresql.prisma /home/z/my-project/prisma/schema.prisma
cd /home/z/my-project
npx prisma db push --accept-data-loss 2>&1
