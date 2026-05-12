import { createAutonomousSwarmRun, getControlPlaneSnapshot } from "../server/db";

async function main() {
  const snapshot = await getControlPlaneSnapshot();
  const swarm = snapshot.agentSwarms[0];

  if (!swarm) {
    throw new Error("Kein Agentenschwarm für den Demo-Lauf gefunden.");
  }

  const existing = (snapshot.swarmAutonomyRuns ?? []).find(run => run.swarmId === swarm.id);
  if (existing) {
    console.log(JSON.stringify({ status: "exists", swarmId: swarm.id, runId: existing.id, runStatus: existing.status }, null, 2));
    return;
  }

  const run = await createAutonomousSwarmRun({
    swarmId: swarm.id,
    objective: "Koordiniere einen mehrstufigen Incident-Review mit Analyse, Kundenkommunikation und Governance-Abschluss.",
    context: "Der Demo-Lauf soll reale Schritt- und Ereignisdaten für die Agenten-Verwaltung bereitstellen und den unteren Autonomie-Bereich sichtbar belegen.",
    priority: "urgent",
    requestedByUserId: null,
    requestedByLabel: "Manus Demo Seeder",
    requestedByRole: "system",
  });

  console.log(JSON.stringify({ status: "created", swarmId: swarm.id, runId: run.id, runStatus: run.status, governanceStatus: run.governanceStatus }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
