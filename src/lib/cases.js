import { supabase } from './supabaseClient';

// Persist a completed workflow as one row in `cases` (scoped to the signed-in
// user by RLS). Returns the inserted row.
export async function saveCase({ patientInfo, scanResults, plannerConfig }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to save a case.');

  const row = {
    user_id: user.id,
    patient_name: patientInfo?.patientName ?? null,
    patient_id: patientInfo?.patientId ?? null,
    case_type: patientInfo?.caseType ?? null,
    notes: patientInfo?.notes ?? null,
    detected_shade: scanResults?.middle?.shade?.name ?? null,
    scan_results: scanResults ?? null,
    planner_config: plannerConfig ?? null,
  };

  const { data, error } = await supabase.from('cases').insert(row).select().single();
  if (error) throw error;
  return data;
}

// List the signed-in user's cases, newest first.
export async function listCases() {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteCase(id) {
  const { error } = await supabase.from('cases').delete().eq('id', id);
  if (error) throw error;
}
