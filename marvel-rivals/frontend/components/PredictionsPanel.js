export default function PredictionsPanel({ prediction }) {
  if (!prediction) return null;
  if (prediction.available === false) {
    return (
      <div style={{ marginTop: 12, padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8 }}>
        <b>Predictive analytics:</b> No model output yet ({prediction.reason || 'coming soon'}).
      </div>
    );
  }
  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <b>Predictive analytics</b>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(prediction, null, 2)}</pre>
    </div>
  );
}
