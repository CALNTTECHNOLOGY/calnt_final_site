import { useState } from 'react';

const SUBSIDY_TABLE: Record<string, number> = {
  '1': 30000,
  '2': 60000,
  '3': 78000,
};

function getSubsidy(kw: number): number {
  if (kw <= 1) return SUBSIDY_TABLE['1'];
  if (kw <= 2) return SUBSIDY_TABLE['2'];
  return SUBSIDY_TABLE['3'];
}

function estimateSystem(bill: number) {
  const monthlyUnits = bill / 7;
  const sizeKw = Math.max(1, Math.round((monthlyUnits / 120) * 2) / 2);
  const capped = Math.min(sizeKw, 10);
  const costPerKw = 45000;
  const totalCost = capped * costPerKw;
  const subsidy = getSubsidy(capped);
  const net = totalCost - subsidy;
  const annualSaving = bill * 12 * 0.85;
  const payback = net / annualSaving;
  return { sizeKw: capped, totalCost, subsidy, net, annualSaving, payback };
}

export default function Calculator() {
  const [bill, setBill] = useState('');
  const [result, setResult] = useState<ReturnType<typeof estimateSystem> | null>(null);

  function calculate() {
    const b = parseFloat(bill);
    if (!b || b < 100) return;
    setResult(estimateSystem(b));
  }

  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="calc-card">
      <div className="calc-inputs">
        <div className="calc-field">
          <label>Monthly Electricity Bill (₹)</label>
          <input
            type="number"
            placeholder="e.g. 3000"
            value={bill}
            onChange={e => setBill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            min="100"
          />
        </div>
        <button className="btn btn-primary btn-lg calc-go" onClick={calculate}>
          Calculate Savings
        </button>
      </div>

      {result && (
        <div className="calc-results">
          <div className="calc-result-grid">
            <div className="calc-stat">
              <span className="calc-stat-label">Recommended System</span>
              <span className="calc-stat-value">{result.sizeKw} kW</span>
            </div>
            <div className="calc-stat">
              <span className="calc-stat-label">Estimated Cost</span>
              <span className="calc-stat-value">{fmt(result.totalCost)}</span>
            </div>
            <div className="calc-stat highlight">
              <span className="calc-stat-label">PM Surya Ghar Subsidy</span>
              <span className="calc-stat-value green">{fmt(result.subsidy)}</span>
            </div>
            <div className="calc-stat highlight">
              <span className="calc-stat-label">Net Investment</span>
              <span className="calc-stat-value">{fmt(result.net)}</span>
            </div>
            <div className="calc-stat">
              <span className="calc-stat-label">Annual Savings</span>
              <span className="calc-stat-value green">{fmt(result.annualSaving)}</span>
            </div>
            <div className="calc-stat">
              <span className="calc-stat-label">Payback Period</span>
              <span className="calc-stat-value">{result.payback.toFixed(1)} yrs</span>
            </div>
          </div>
          <p className="calc-disclaimer">
            * Estimates based on average tariffs and PM Surya Ghar subsidy rates. Final figures depend on site assessment.
          </p>
        </div>
      )}
    </div>
  );
}
