ALTER TABLE places
  ALTER COLUMN district_id DROP NOT NULL,
  ADD COLUMN province_code varchar(20),
  ADD COLUMN administrative_ward_code varchar(20);

ALTER TABLE places
  ADD CONSTRAINT places_province_code_fkey
    FOREIGN KEY (province_code) REFERENCES provinces(code),
  ADD CONSTRAINT places_administrative_ward_code_fkey
    FOREIGN KEY (administrative_ward_code) REFERENCES administrative_wards(code);

CREATE INDEX places_canonical_location_idx
  ON places (province_code, administrative_ward_code);

CREATE TABLE place_administrative_location_exceptions (
  id serial PRIMARY KEY,
  place_id integer NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  dataset_release_id integer NOT NULL REFERENCES administrative_dataset_releases(id) ON DELETE CASCADE,
  reason varchar(40) NOT NULL,
  candidate_ward_codes varchar(20)[] NOT NULL DEFAULT '{}',
  suggested_wards jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'open',
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, dataset_release_id),
  CHECK (reason IN ('zero_match', 'multiple_matches', 'invalid_coordinate', 'outside_province')),
  CHECK (status IN ('open', 'resolved', 'waived'))
);

CREATE INDEX place_admin_location_exceptions_release_status_idx
  ON place_administrative_location_exceptions (dataset_release_id, status);
