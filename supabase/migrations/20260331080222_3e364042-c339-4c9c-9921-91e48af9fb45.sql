CREATE OR REPLACE FUNCTION public.admin_delete_profile(_profile_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.finance_tables WHERE user_id = _profile_user_id;
  DELETE FROM public.finance_folders WHERE user_id = _profile_user_id;
  DELETE FROM public.services WHERE user_id = _profile_user_id;
  DELETE FROM public.received_proposals WHERE user_id = _profile_user_id;
  DELETE FROM public.proposal_links WHERE user_id = _profile_user_id;
  DELETE FROM public.generated_documents WHERE user_id = _profile_user_id;
  DELETE FROM public.custom_templates WHERE user_id = _profile_user_id;
  DELETE FROM public.user_settings WHERE user_id = _profile_user_id;
  DELETE FROM public.user_roles WHERE user_id = _profile_user_id;
  DELETE FROM public.profiles WHERE user_id = _profile_user_id;
END;
$function$;