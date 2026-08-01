import MarketOverview from '../components/MarketOverview';

export default function MarketOverviewPage({ fearGreed, marketRSI, allFunding, loading }) {
  return (
    <div className="full-page">
      <MarketOverview fearGreed={fearGreed} marketRSI={marketRSI} allFunding={allFunding} loading={loading} />
    </div>
  );
}
