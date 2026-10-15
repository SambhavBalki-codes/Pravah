// columns: [{ key, header, render?(row), className?, align?: "left" | "right" }]
const DataTable = ({ columns, rows, rowKey = "_id", caption }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="w-full min-w-[640px] text-left text-sm">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className={`px-5 py-3.5 font-semibold ${col.align === "right" ? "text-right" : ""}`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row[rowKey]} className="transition hover:bg-slate-50">
            {columns.map((col) => (
              <td
                key={col.key}
                className={`px-5 py-3.5 text-slate-600 ${col.align === "right" ? "text-right" : ""} ${col.className || ""}`}
              >
                {col.render ? col.render(row) : row[col.key] ?? "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DataTable;