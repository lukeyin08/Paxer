/**
 * The developers-page example: the cURL request and the JSON response it
 * returns, side by side.
 */
export function CodeDemo({ request, response }: { request: string; response: string }) {
  return (
    <div className="container grid grid-cols-1 gap-6 py-20 lg:grid-cols-2">
      <div>
        <p className="kicker mb-3">Request</p>
        <pre className="overflow-x-auto rounded-lg border border-rule bg-card p-4 font-mono text-xs leading-relaxed text-muted">
          {request}
        </pre>
      </div>
      <div>
        <p className="kicker mb-3">Response</p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-rule bg-card p-4 font-mono text-xs leading-relaxed text-muted">
          {response}
        </pre>
      </div>
    </div>
  );
}
