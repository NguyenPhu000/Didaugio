CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS vn_admin_source;

CREATE TABLE administrative_dataset_releases (
  id serial PRIMARY KEY,
  source_repo text NOT NULL,
  source_ref text NOT NULL,
  source_commit text NOT NULL,
  release_name text NOT NULL,
  manifest_checksum text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  UNIQUE (source_repo, source_commit)
);

CREATE UNIQUE INDEX administrative_dataset_one_active_idx
  ON administrative_dataset_releases ((is_active))
  WHERE is_active;

CREATE TABLE provinces (
  code varchar(20) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE administrative_wards (
  code varchar(20) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE province_dataset_records (
  dataset_release_id integer NOT NULL REFERENCES administrative_dataset_releases(id) ON DELETE CASCADE,
  province_code varchar(20) NOT NULL REFERENCES provinces(code),
  name varchar(255) NOT NULL,
  name_en varchar(255),
  full_name varchar(255) NOT NULL,
  full_name_en varchar(255),
  code_name varchar(255),
  search_name text NOT NULL,
  administrative_type varchar(40) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (dataset_release_id, province_code)
);

CREATE INDEX province_records_release_active_idx
  ON province_dataset_records (dataset_release_id, is_active);
CREATE INDEX province_records_search_trgm_idx
  ON province_dataset_records USING gist (search_name gist_trgm_ops);

CREATE TABLE administrative_ward_dataset_records (
  dataset_release_id integer NOT NULL REFERENCES administrative_dataset_releases(id) ON DELETE CASCADE,
  ward_code varchar(20) NOT NULL REFERENCES administrative_wards(code),
  province_code varchar(20) NOT NULL REFERENCES provinces(code),
  name varchar(255) NOT NULL,
  name_en varchar(255),
  full_name varchar(255),
  full_name_en varchar(255),
  code_name varchar(255),
  search_name text NOT NULL,
  administrative_type varchar(40) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (dataset_release_id, ward_code),
  FOREIGN KEY (dataset_release_id, province_code)
    REFERENCES province_dataset_records(dataset_release_id, province_code),
  CHECK (administrative_type IN ('ward', 'commune', 'special_region'))
);

CREATE INDEX ward_records_release_province_active_idx
  ON administrative_ward_dataset_records (dataset_release_id, province_code, is_active);
CREATE INDEX ward_records_search_trgm_idx
  ON administrative_ward_dataset_records USING gist (search_name gist_trgm_ops);

CREATE TABLE province_boundaries (
  dataset_release_id integer NOT NULL,
  province_code varchar(20) NOT NULL,
  area_km2 numeric(12,5),
  bbox geometry(Polygon, 4326),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  PRIMARY KEY (dataset_release_id, province_code),
  FOREIGN KEY (dataset_release_id, province_code)
    REFERENCES province_dataset_records(dataset_release_id, province_code) ON DELETE CASCADE,
  CHECK (ST_SRID(geom) = 4326),
  CHECK (ST_IsValid(geom))
);
CREATE INDEX province_boundaries_geom_gist_idx ON province_boundaries USING gist (geom);

CREATE TABLE administrative_ward_boundaries (
  dataset_release_id integer NOT NULL,
  ward_code varchar(20) NOT NULL,
  area_km2 numeric(12,5),
  bbox geometry(Polygon, 4326),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  PRIMARY KEY (dataset_release_id, ward_code),
  FOREIGN KEY (dataset_release_id, ward_code)
    REFERENCES administrative_ward_dataset_records(dataset_release_id, ward_code) ON DELETE CASCADE,
  CHECK (ST_SRID(geom) = 4326),
  CHECK (ST_IsValid(geom))
);
CREATE INDEX administrative_ward_boundaries_geom_gist_idx
  ON administrative_ward_boundaries USING gist (geom);

CREATE TABLE vn_admin_source.provinces (
  dataset_release_id integer NOT NULL REFERENCES public.administrative_dataset_releases(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY (dataset_release_id, code)
);

CREATE TABLE vn_admin_source.wards (
  dataset_release_id integer NOT NULL REFERENCES public.administrative_dataset_releases(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL,
  province_code varchar(20) NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY (dataset_release_id, code)
);

CREATE TABLE vn_admin_source.province_boundaries (
  dataset_release_id integer NOT NULL REFERENCES public.administrative_dataset_releases(id) ON DELETE CASCADE,
  province_code varchar(20) NOT NULL,
  gis_server_id varchar(20),
  area_km2 numeric(12,5),
  bbox geometry(Polygon, 4326),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  PRIMARY KEY (dataset_release_id, province_code)
);

CREATE TABLE vn_admin_source.ward_boundaries (
  dataset_release_id integer NOT NULL REFERENCES public.administrative_dataset_releases(id) ON DELETE CASCADE,
  ward_code varchar(20) NOT NULL,
  province_code varchar(20) NOT NULL,
  gis_server_id varchar(20),
  area_km2 numeric(12,5),
  bbox geometry(Polygon, 4326),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  PRIMARY KEY (dataset_release_id, ward_code)
);
