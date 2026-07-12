• Participant capabilities

  Participants can:

  - Accept a round invitation using a token link.
  - View their assigned rounds and round status.
  - Complete and edit the participant registration form:
      - Laboratory and responsible-person data.
      - Contact and location details.
      - Accompanying personnel.
      - Analyzers and instruments.
      - Logistics and arrival information.
      - Declarations and authorized signature name.
      - Optional ARL/social-security PDFs for accompanying personnel.

  - Save registration data incrementally and submit the completed form.
  - View their participant code and replicate code.
  - Enter PT results by item, level, run, and sample group.
  - Enter replicates, mean, standard deviation, standard uncertainty, coverage
    factor, and expanded uncertainty.

  - Receive automatic draft saves and completion/error feedback.
  - Submit the final PT report once all required cells are complete.
  - View submitted values afterward, but cannot edit them.
  - For member_special participants only:
      - Import results from CSV.
      - Apply individual or group coverage factors.
      - Clear unsubmitted imported results.

  - After documentary closure:
      - View participant-visible milestones.
      - View published notices.
      - View published evidence metadata.
      - View notifications and mark them as read.
      - Send comments to the QMS/admin team.
      - See admin responses to comments.

  - Open the static participant guide and sign out.

  What participants cannot currently do

  - View other participants or their results.
  - View comparative statistics or performance evaluation results.
  - Download published evidence files or controlled SGC documents.
  - Submit complaints, appeals, nonconformities, or formal cases through a
    participant workflow.

  - Edit or withdraw a final PT submission.
  - Manage their account or organization profile independently.
  - Receive a clear in-app result report or final certificate; these appear to
    depend on admin publications/notifications.

  Important findings

  1. High: public PT mutations do not fully validate round relationships.
     convex/pt/index.ts:318-364 authorizes using rondaParticipanteId, but does not
     verify that rondaId, ptItemId, and sampleGroupId all belong to the same round
     and participant. A participant who can obtain valid IDs could create cross-
     round or inconsistent enviosPt records.

  2. High: PT mutations do not enforce round state server-side.
     upsertEnvioPT and submitFinalPT do not independently require ronda.estado ===
     'activa'. The Next.js actions check this, but the public Convex mutations can
     be called directly and bypass the UI/action layer.

  3. Medium: documentary closure is enforced inconsistently for the registration
     form.
     The main round page blocks documentacion_pendiente, but registration actions
     only reject cerrada (src/app/(protected)/ronda/[codigo]/registro/actions.ts).
     A participant can potentially continue editing or submitting the ficha during
     documentary closure.

  4. Medium: published evidence is visible only as metadata.
     Participants see evidence names and current version status, but getDownloadUrl
     requires SGC management access (convex/sgc/evidencias.ts:25-35). This may be
     intentional, but it means “published evidence” is not actually downloadable by
     participants.

  5. Medium: participant-facing QMS support is limited to comments.
     The SGC model includes cases, communications, documents, and results, but the
     participant UI exposes only milestones, notices, notifications, evidence
     metadata, and comments. There is no participant-facing complaint/appeal/case
     lifecycle.

  The participant experience is therefore primarily a round registration and
  result-submission portal, with a small read-only QMS communication layer after
  closure. The Convex authorization boundary needs tightening before treating the
  PT submission workflow as fully protected.
