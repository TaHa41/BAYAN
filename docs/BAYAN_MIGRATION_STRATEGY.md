# BAYAN v1 migration strategy

Production D1 already has a legacy migration history. v1 uses isolated application tables and a dedicated migration directory/history so the clean rebuild does not replay legacy migrations. Legacy files remain reference artifacts until cutover is finalized.