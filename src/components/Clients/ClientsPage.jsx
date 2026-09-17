import React, { useEffect, useState } from 'react';
import { settingsApi, labourApi } from '../../api';
import { formatCurrency } from '../../utils/format.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import BackButton from '../common/BackButton.jsx';
import SearchBox, { useSearch } from '../common/SearchBox.jsx';

/**
 * Item 12 (2026-09-15, Manager portal): standalone "Clients" page, same
 * content and functionality as the Clients tab added under Admin's Reports -
 * every site (Settings.sites, the same list every Site dropdown across both
 * portals reads from) with its labour totals for a quick overview. Manager
 * has no separate Reports module, so this is its own top-level page instead
 * of a tab.
 */
export default function ClientsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [settingsRes, consolidatedRes] = await Promise.all([settingsApi.get(), labourApi.consolidated({})]);
      const sites = settingsRes.data.sites || [];
      const bySite = new Map((consolidatedRes.data.rows || []).map((r) => [r.site, r]));
      setRows(
        sites.map((site) => {
          const stats = bySite.get(site);
          return {
            site,
            workerCount: stats?.workerCount || 0,
            wageEarned: stats?.wageEarned || 0,
            balanceDue: stats?.balanceDue || 0,
          };
        })
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clients/sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery, filteredRows] = useSearch(rows, ['site']);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <BackButton />
      </div>
      <div className="panel">
        <div className="panel-header-row">
          <h2>Clients</h2>
          <SearchBox value={query} onChange={setQuery} placeholder="Search sites..." />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div className="page-loading">{t('billing.loading')}</div>
        ) : (
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site / Client</th>
                <th>Workers</th>
                <th className="amount-cell">Total Wages</th>
                <th className="amount-cell">Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.site}>
                  <td>{r.site}</td>
                  <td>{r.workerCount}</td>
                  <td className="amount-cell">{formatCurrency(r.wageEarned)}</td>
                  <td className={`amount-cell${r.balanceDue > 0 ? ' danger-text' : ''}`}>{formatCurrency(r.balanceDue)}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    {rows.length === 0 ? 'No sites yet.' : 'No sites match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
