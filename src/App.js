import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";

// NOTE: TailwindCSS classes are used throughout. Install dependencies:
// react, react-dom, react-router-dom, recharts, tailwindcss

// -------------------------
// Mock data (sample from API)
// -------------------------
const SAMPLE_DISTRICTS = [
  { district_code: "0501", district_name: "PATNA" },
  { district_code: "0502", district_name: "NALANDA" },
  { district_code: "0506", district_name: "JEHANABAD" },
  { district_code: "0518", district_name: "SAMASTIPUR" },
  { district_code: "0544", district_name: "SUPAUL" },
  { district_code: "0504", district_name: "ROHTAS" },
  { district_code: "0508", district_name: "NAWADA" },
  { district_code: "0513", district_name: "PURBI CHAMPARAN" },
  { district_code: "0520", district_name: "MADHUBANI" },
  { district_code: "0541", district_name: "ARARIA" }
];

// sample time-series for a district (month order)
const SAMPLE_TIMESERIES = [
  { month: "Apr", households: 90000, persondays: 300000, expenditure: 12000 },
  { month: "May", households: 92000, persondays: 320000, expenditure: 13000 },
  { month: "Jun", households: 87000, persondays: 310000, expenditure: 12500 },
  { month: "Jul", households: 94000, persondays: 330000, expenditure: 14000 },
  { month: "Aug", households: 96000, persondays: 340000, expenditure: 15000 },
  { month: "Sep", households: 88000, persondays: 300000, expenditure: 11800 },
  { month: "Oct", households: 91000, persondays: 315000, expenditure: 12700 },
  { month: "Nov", households: 93000, persondays: 325000, expenditure: 13200 },
  { month: "Dec", households: 87155, persondays: 3443327, expenditure: 15209 }
];

// -------------------------
// Helper: friendly number formatter
// -------------------------
const formatNumber = (n) => {
  if (n === null || n === undefined) return "—";
  if (n >= 1e7) return (n / 1e7).toFixed(1) + " Cr"; // crore
  if (n >= 1e5) return (n / 1e5).toFixed(1) + " L"; // lakh
  return n.toLocaleString();
};

// -------------------------
// Header
// -------------------------
function Header({ lang, setLang }) {
  return (
    <header className="bg-gradient-to-r from-sky-700 to-indigo-700 text-white p-4 shadow">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl font-semibold">MG</div>
          <div>
            <div className="text-lg font-bold">MGNREGA — District View</div>
            <div className="text-sm opacity-80">Simple, local-friendly insights</div>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/" className="hover:underline">{lang === 'hi' ? 'मुख्‍य पृष्ठ' : 'Home'}</Link>
          <Link to="/state-comparison" className="hover:underline">
            {lang === 'hi' ? 'राज्य तुलना' : 'State Comparison'}
          </Link>

          <Link to="/compare" className="hover:underline">{lang === 'hi' ? 'तुलना' : 'Compare'}</Link>
          <Link to="/about" className="hover:underline">{lang === 'hi' ? 'जानकारी' : 'About'}</Link>
          <button
            onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
            className="bg-white/10 px-3 py-1 rounded"
            aria-label="Toggle language"
          >
            {lang === 'hi' ? 'EN' : 'हिन्दी'}
          </button>
        </nav>
      </div>
    </header>
  );
}

// -------------------------
// District Selector component
// -------------------------
function DistrictSelector({ districts, value, onChange, onDetect }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <label className="text-sm mr-2">Select District</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 rounded border w-full sm:w-64"
      >
        <option value="">-- Choose district --</option>
        {districts.map((d) => (
          <option key={d.district_code} value={d.district_code}>{d.district_name}</option>
        ))}
      </select>

      <button onClick={onDetect} className="ml-auto bg-sky-600 text-white px-3 py-2 rounded">Detect my district</button>
    </div>
  );
}

// -------------------------
// KPI Card
// -------------------------
function KpiCard({ title, value, hint, status }) {
  const color = status === 'good' ? 'text-green-600' : status === 'warn' ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="bg-white rounded-2xl p-4 shadow min-w-[160px]">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400">{hint}</div>
    </div>
  );
}

// -------------------------
// Dashboard page
// -------------------------
function Dashboard({ lang }) {
  const [district, setDistrict] = useState("");
  const [districtInfo, setDistrictInfo] = useState(null);
  const [timeseries, setTimeseries] = useState(SAMPLE_TIMESERIES);

const API_URL = process.env.REACT_APP_API_URL;

useEffect(() => {
  if (!district) return;

  // Fetch real district data from backend
  fetch(`${API_URL}/api/data/${district}`)
    .then(res => res.json())
   .then(data => {
  setDistrictInfo(data.kpis);
  setTimeseries(data.timeseries || []);
})

    .catch(err => {
      console.error("Error fetching data:", err);
      alert("Failed to fetch live data, showing sample instead.");
      setDistrictInfo({
        district_name: SAMPLE_DISTRICTS.find(d => d.district_code === district)?.district_name || 'Unknown',
        Total_Individuals_Worked: 90928,
        Total_Households_Worked: 87155,
        Total_Exp: 15209,
        Women_Persondays: 1696959,
        Average_days_of_employment_provided_per_Household: 39,
        percentage_payments_gererated_within_15_days: 100.74
      });
      setTimeseries(SAMPLE_TIMESERIES);
    });
}, [district]);


  const handleDetect = () => {
    // best-effort geolocation -> district detection
    if (!navigator.geolocation) {
      alert('Geolocation not available on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      // NOTE: reverse-geocoding ideally happens on backend (avoids exposing API keys); here we try a free service
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const jd = await res.json();
        // bigdatacloud returns locality/principalSubdivision etc. We'll try locality -> district
        // This is best-effort: if district cannot be mapped, fallback to manual select.
        const locality = jd.locality || jd.city || jd.principalSubdivision;
        // try match with sample list
        const match = SAMPLE_DISTRICTS.find(d => locality && locality.toUpperCase().includes(d.district_name.split(' ')[0]));
        if (match) setDistrict(match.district_code);
        else alert('Could not auto-detect district. Please select from list.');
      } catch (e) {
        console.error(e);
        alert('Auto-detect failed — please select manually.');
      }
    }, (err) => {
      alert('Location permission denied or unavailable');
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{lang === 'hi' ? 'जिला प्रदर्शन' : 'District Performance'}</h1>

      <DistrictSelector districts={SAMPLE_DISTRICTS} value={district} onChange={setDistrict} onDetect={handleDetect} />

      {!district && (
        <div className="bg-yellow-50 p-4 rounded">Select a district or use "Detect my district" to begin.</div>
      )}

      {districtInfo && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title={lang === 'hi' ? 'कुल व्यक्ति' : 'Total Individuals'} value={formatNumber(districtInfo.Total_Individuals_Worked)} hint={lang === 'hi' ? 'कुल लोगों ने काम किया' : 'Total individuals worked'} status={'good'} />
            <KpiCard title={lang === 'hi' ? 'कुल खर्च (लाख)' : 'Total Expenditure'} value={`₹ ${formatNumber(districtInfo.Total_Exp)}`} hint={lang === 'hi' ? 'कुल खर्च' : 'Total exp (last month)'} status={'warn'} />
            <KpiCard title={lang === 'hi' ? 'औसत दिनों/घरेलू' : 'Avg days/HH'} value={districtInfo.Average_days_of_employment_provided_per_Household} hint={lang === 'hi' ? 'औसत रोजगार दिन' : 'Average days of employment'} status={'good'} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">{lang === 'hi' ? 'मासिक व्यक्ति-दिन (Persondays)' : 'Monthly Persondays'}</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={timeseries}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="persondays" stroke="#2563EB" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">{lang === 'hi' ? 'मासिक खर्च' : 'Monthly Expenditure'}</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={timeseries}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="expenditure" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-4 bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">{lang === 'hi' ? 'सारांश' : 'Summary'}</h3>
            <p className="text-sm text-gray-700">{lang === 'hi' ? 'यह डेटा सार्वजनिक स्रोत से लिया गया है और समय-समय पर अपडेट किया जाएगा। अगर API डाउन है, तो पिछला स्टोर किया गया डेटा दिखेगा।' : 'This data is sourced from public APIs and will be refreshed periodically. If the upstream API is down, the last stored snapshot will be shown.'}</p>
          </section>
        </>
      )}

    </div>
  );
}


// -------------------------
// State Comparison Page
// -------------------------
const mockStateData = {
  '2023-24': SAMPLE_TIMESERIES,
  '2024-25': SAMPLE_TIMESERIES.map(d => ({ ...d, persondays: d.persondays + 5000, expenditure: d.expenditure + 1000 })),
};


function StateComparison() {
  const [selectedYears, setSelectedYears] = useState(['2023-24', '2024-25']);
  const [data, setData] = useState({});


  useEffect(() => setData(mockStateData), []);


  const handleYearChange = (e) => {
    const { value, checked } = e.target;
    setSelectedYears(prev => checked ? [...prev, value] : prev.filter(y => y !== value));
  };


  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const combinedData = months.map(month => {
    const point = { month };
    selectedYears.forEach(year => { point[year] = data[year]?.find(m => m.month === month)?.expenditure || 0; });
    return point;
  });


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">State Performance Comparison</h1>
      <div className="mb-6">
        {Object.keys(mockStateData).map(year => (
          <label key={year} className="mr-4">
            <input type="checkbox" value={year} checked={selectedYears.includes(year)} onChange={handleYearChange} className="mr-1" />
            {year}
          </label>
        ))}
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Monthly Expenditure</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedYears.map((year, idx) => <Line key={year} type="monotone" dataKey={year} stroke={['#8884d8', '#82ca9d', '#ffc658'][idx % 3]} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Total Households Worked</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={selectedYears.map(year => ({ year, Total_Households_Worked: data[year]?.reduce((sum, m) => sum + (m.households || 0), 0) }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Total_Households_Worked" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// -------------------------
// Compare page
// -------------------------
function Compare({ lang }) {
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");

  // For demo, create mock side-by-side values
  const getMock = (code) => {
    const base = SAMPLE_TIMESERIES.map(s => ({ ...s }));
    // tweak values slightly by district code hash
    const factor = code ? (parseInt(code.slice(-1)) % 5) + 8 : 10;
    return base.map(b => ({ ...b, persondays: Math.round(b.persondays * factor / 10), expenditure: Math.round(b.expenditure * factor / 10) }));
  };

  const series1 = getMock(d1);
  const series2 = getMock(d2);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{lang === 'hi' ? 'जिला तुलना' : 'Compare Districts'}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <label className="block mb-2">{lang === 'hi' ? 'पहला जिला' : 'First district'}</label>
          <select className="w-full p-2 rounded" value={d1} onChange={e => setD1(e.target.value)}>
            <option value="">Select district</option>
            {SAMPLE_DISTRICTS.map(d => <option key={d.district_code} value={d.district_code}>{d.district_name}</option>)}
          </select>

          <div className="mt-4">
            <h4 className="font-semibold">Monthly persondays</h4>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={series1}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="persondays" stroke="#10B981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <label className="block mb-2">{lang === 'hi' ? 'दूसरा जिला' : 'Second district'}</label>
          <select className="w-full p-2 rounded" value={d2} onChange={e => setD2(e.target.value)}>
            <option value="">Select district</option>
            {SAMPLE_DISTRICTS.map(d => <option key={d.district_code} value={d.district_code}>{d.district_name}</option>)}
          </select>

          <div className="mt-4">
            <h4 className="font-semibold">Monthly persondays</h4>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={series2}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="persondays" stroke="#EF4444" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold">Side-by-side numbers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <div className="p-3 border rounded">District A: {d1 || '—'}</div>
          <div className="p-3 border rounded">District B: {d2 || '—'}</div>
          <div className="p-3 border rounded">Tip: compare persondays and expenditure to see workload vs spend.</div>
        </div>
      </div>
    </div>
  );
}

// -------------------------
// About and Contact
// -------------------------
function About({ lang }) {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold">{lang === 'hi' ? 'MGNREGA क्या है?' : 'What is MGNREGA?'}</h1>
      <p className="mt-3 text-gray-700">{lang === 'hi' ? 'MGNREGA एक ग्रामीण रोजगार गारंटी योजना है। यह साइट आपके जिले के प्रदर्शन को सरल भाषा और चार्ट में दिखाती है।' : 'MGNREGA is a rural employment guarantee scheme. This site presents district performance in simple language and charts.'}</p>
    </div>
  );
}

function Contact({ lang }) {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold">{lang === 'hi' ? 'संपर्क करें' : 'Contact / Feedback'}</h1>
      <p className="mt-2 text-sm text-gray-600">{lang === 'hi' ? 'सरल प्रतिक्रिया फॉर्म' : 'Simple feedback form — stores to backend or sends email.'}</p>
      <form className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder={lang === 'hi' ? 'नाम' : 'Name'} className="p-2 border rounded" />
        <input placeholder={lang === 'hi' ? 'मोबाइल / ईमेल' : 'Mobile / Email'} className="p-2 border rounded" />
        <textarea placeholder={lang === 'hi' ? 'संदेश' : 'Message'} className="p-2 border rounded col-span-1 sm:col-span-2" />
        <button className="bg-sky-600 text-white px-4 py-2 rounded col-span-1 sm:col-span-2">{lang === 'hi' ? 'जमा करें' : 'Submit'}</button>
      </form>
    </div>
  );
}

// -------------------------
// App root
// -------------------------
export default function App() {
  const [lang, setLang] = useState('en');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header lang={lang} setLang={setLang} />

        <main className="py-6">
          <Routes>
            <Route path="/" element={<Dashboard lang={lang} />} />
            <Route path="/state-comparison" element={<StateComparison />} />
            <Route path="/compare" element={<Compare lang={lang} />} />
            <Route path="/about" element={<About lang={lang} />} />
            <Route path="/contact" element={<Contact lang={lang} />} />
          </Routes>
        </main>

        <footer className="bg-white border-t p-4 text-center text-sm text-gray-500">Built for Bihar — demo UI • Replace mock data with backend API for full app</footer>
      </div>
    </Router>
  );
}

// -------------------------
// Mount when used independently (optional)
// -------------------------
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);

  // For hot reload safety
  root.render(<App />);
}
