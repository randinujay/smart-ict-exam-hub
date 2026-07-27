export function WorkspaceRouteLoading() {
  return <div className="workspace-route-loading" role="status" aria-label="Loading page">
    <div className="route-loading-heading" />
    <div className="route-loading-stats">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
    <div className="route-loading-panels"><span /><span /></div>
  </div>;
}
