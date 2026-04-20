# Migration Status

Die Migration `drizzle/0003_lean_hobgoblin.sql` für `stageMode`, `laneKey`, `branchSourceStageOrder`, `branchLabel`, `branchOperator` und `branchValue` wurde gegen die Projekt-Datenbank bereits angewendet.

Die erneute Ausführung des Hilfsskripts `node apply_drizzle_migration.mjs ./drizzle/0003_lean_hobgoblin.sql` führte zu `ER_DUP_FIELDNAME` für `stageMode`. Das bestätigt, dass die Spalte bereits vorhanden ist und die Migration nicht mehr aussteht.

Zusätzlich wurde mit `node verify_approval_schema.mjs` eine Schema-Inspektion gegen `information_schema.COLUMNS` durchgeführt. Das Ergebnis war `ok: true`; für `approvalStages` fehlte keine der erwarteten Spalten `stageMode`, `laneKey`, `branchSourceStageOrder`, `branchLabel`, `branchOperator` und `branchValue`.

Damit ist der Datenbankzustand mit dem aktuellen Codepfad für parallele Freigabestufen und bedingte Verzweigungen synchron.
