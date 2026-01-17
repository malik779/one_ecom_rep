-- Add new fields to products table for extended product information
alter table public.products
add column if not exists image_urls text[],
add column if not exists size text,
add column if not exists color text,
add column if not exists material text,
add column if not exists brand text,
add column if not exists ply_rating text,
add column if not exists about text[];
