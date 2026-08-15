/**
 * The developers-page example: the cURL request and the JSON response it
 * returns, side by side.
 */
export function CodeDemo({ request, response }: { request: string; response: string }) {
  return (
    <div className="measure grid grid-cols-1 gap-8 border-t border-rule py-12">
      <div>
        <h2 className="mb-3 text-lg leading-snug">Request</h2>
        <pre className="overflow-x-auto border border-rule bg-soft p-4 font-mono text-xs leading-relaxed text-ink">
          {request}
        </pre>
      </div>
      <div>
        <h2 className="mb-3 text-lg leading-snug">Response</h2>
        <pre className="overflow-x-auto whitespace-pre-wrap border border-rule bg-soft p-4 font-mono text-xs leading-relaxed text-ink">
          {response}
        </pre>
      </div>
    </div>
  );
}
