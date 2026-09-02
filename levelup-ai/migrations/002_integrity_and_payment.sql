-- Additional cross-owner integrity and atomic approval for the PostgreSQL foundation.
-- Apply after 001_postgresql.sql. Runtime SQLite uses its own validated service transactions.
BEGIN;
SET search_path = levelup, pg_catalog;
ALTER TABLE path_enrollments ADD CONSTRAINT enrollment_id_owner_unique UNIQUE(id,user_id);
ALTER TABLE uploads ADD CONSTRAINT upload_id_owner_unique UNIQUE(id,user_id);
ALTER TABLE orders ADD CONSTRAINT order_id_owner_unique UNIQUE(id,user_id);
ALTER TABLE task_submissions ADD CONSTRAINT submission_enrollment_owner_fk
  FOREIGN KEY(enrollment_id,user_id) REFERENCES path_enrollments(id,user_id);
ALTER TABLE task_submissions ADD CONSTRAINT submission_upload_owner_fk
  FOREIGN KEY(upload_id,user_id) REFERENCES uploads(id,user_id);
ALTER TABLE payment_proofs ADD CONSTRAINT proof_order_owner_fk
  FOREIGN KEY(order_id,user_id) REFERENCES orders(id,user_id);
ALTER TABLE payment_proofs ADD CONSTRAINT proof_upload_owner_fk
  FOREIGN KEY(upload_id,user_id) REFERENCES uploads(id,user_id);
ALTER TABLE subscriptions ADD CONSTRAINT subscription_order_owner_fk
  FOREIGN KEY(order_id,user_id) REFERENCES orders(id,user_id);
ALTER TABLE marketplace_sales ADD CONSTRAINT sale_order_owner_fk
  FOREIGN KEY(order_id,buyer_id) REFERENCES orders(id,user_id);
ALTER TABLE ai_coach_messages ADD CONSTRAINT coach_enrollment_owner_fk
  FOREIGN KEY(enrollment_id,user_id) REFERENCES path_enrollments(id,user_id);

CREATE FUNCTION approve_manual_payment(order_to_approve uuid, reviewer uuid, private_note text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=levelup,pg_catalog AS $$
DECLARE
  purchase levelup.orders%ROWTYPE;
  listing levelup.marketplace_paths%ROWTYPE;
  record_id uuid;
  commission integer;
BEGIN
  -- Only the validated server service account may execute this function.
  IF reviewer IS DISTINCT FROM levelup.current_user_id() OR NOT EXISTS (
    SELECT 1 FROM levelup.users WHERE id=reviewer AND role='admin' AND blocked_at IS NULL AND deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Administrator session required' USING ERRCODE='42501'; END IF;
  IF length(private_note)>2000 THEN RAISE EXCEPTION 'Internal note is too long'; END IF;

  SELECT * INTO purchase FROM levelup.orders WHERE id=order_to_approve AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF purchase.status='approved' THEN RETURN purchase.id; END IF;
  IF purchase.status NOT IN ('proof_uploaded','under_review') THEN RAISE EXCEPTION 'Order is not ready for review'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM levelup.payment_proofs p JOIN levelup.uploads u ON u.id=p.upload_id
    WHERE p.order_id=purchase.id AND p.user_id=purchase.user_id AND p.deleted_at IS NULL AND u.deleted_at IS NULL AND u.scan_status='clean'
  ) THEN RAISE EXCEPTION 'A reviewed, clean payment proof is required'; END IF;

  IF purchase.plan_id IS NOT NULL THEN
    IF purchase.plan_id='FREE' THEN RAISE EXCEPTION 'Free cannot be purchased'; END IF;
    INSERT INTO levelup.subscriptions(user_id,plan_id,order_id,status,starts_at,expires_at)
    VALUES(purchase.user_id,purchase.plan_id,purchase.id,'active',now(),now()+interval '30 days')
    RETURNING id INTO record_id;
  ELSE
    SELECT * INTO listing FROM levelup.marketplace_paths WHERE id=purchase.marketplace_path_id;
    IF NOT FOUND OR listing.status<>'approved' OR listing.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Marketplace path is unavailable'; END IF;
    -- Commission is stored as accounting data; this function never transfers money.
    commission := round(purchase.amount_agorot * 0.20);
    INSERT INTO levelup.marketplace_sales(marketplace_path_id,buyer_id,order_id,amount_agorot,commission_agorot,creator_agorot)
    VALUES(listing.id,purchase.user_id,purchase.id,purchase.amount_agorot,commission,purchase.amount_agorot-commission)
    RETURNING id INTO record_id;
  END IF;

  UPDATE levelup.orders SET status='approved',reviewed_by=reviewer,reviewed_at=now(),internal_note=private_note WHERE id=purchase.id;
  UPDATE levelup.payment_proofs SET status='reviewed' WHERE order_id=purchase.id AND deleted_at IS NULL;
  INSERT INTO levelup.notifications(user_id,message,target) VALUES(purchase.user_id,
    '{"he":"התשלום אושר והגישה עודכנה.","en":"Payment approved. Your access has been updated."}', '/settings');
  INSERT INTO levelup.admin_actions(actor_id,action,target_type,target_id,before_state,after_state)
  VALUES(reviewer,'payment.approved','order',purchase.id::text,jsonb_build_object('status',purchase.status),
    jsonb_build_object('status','approved','amountAgorot',purchase.amount_agorot,'entitlementRecord',record_id));
  RETURN purchase.id;
END $$;
REVOKE ALL ON FUNCTION approve_manual_payment(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_manual_payment(uuid,uuid,text) TO levelup_service;
COMMIT;
