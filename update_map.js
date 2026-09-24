const fs = require('fs');

let content = fs.readFileSync('client/src/components/MapModule.jsx', 'utf-8');

const old_state = `  const [leadType, setLeadType] = useState('Field Visit');
  const [sport, setSport] = useState('other');
  const [contactPerson, setContactPerson] = useState('');
  const [contactRole, setContactRole] = useState('Owner');
  const [leadPhone, setLeadPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [leadStatus, setLeadStatus] = useState('New Lead');
  const [interestLevel, setInterestLevel] = useState('Medium');
  const [clientRequirement, setClientRequirement] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');`;

const new_state = `  const EMPTY_FORM = {
    sno: '', name: '', phone: '', email: '', district: '', category: '',
    contactAvailability: 'Yes', status: 'New Lead', leadType: 'Offline',
    assignedTo: '', followUpDate: '', source: 'field',
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    location: { address: '' }, clientRequirement: '', notes: ''
  };
  const [form, setForm] = useState(EMPTY_FORM);`;

content = content.replace(old_state, new_state);

const old_open = `  const openAddLead = (item) => {
    if (item.existingLead) {
      setViewLeadTarget(item);
      return;
    }
    setLeadTarget(item);
    setContactPerson(item.contactPerson || '');
    setContactRole('Owner');
    setLeadPhone(item.phone || '');
    setAlternatePhone('');
    setLeadType('Field Visit');
    setLeadStatus('New Lead');
    setInterestLevel('Medium');
    setClientRequirement('');
    setFollowUpDate('');
    setNotes('');
  };`;

const new_open = `  const openAddLead = (item) => {
    if (item.existingLead) {
      setViewLeadTarget(item);
      return;
    }
    setLeadTarget(item);
    setForm({
      sno: item.sno || '',
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      district: item.district || '',
      category: item.category || '',
      contactAvailability: 'Yes',
      status: 'New Lead',
      leadType: 'Offline',
      assignedTo: '',
      followUpDate: '',
      source: 'field',
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      location: { address: item.location?.address || item.address || item.name || '' },
      clientRequirement: '',
      notes: ''
    });
  };`;

content = content.replace(old_open, new_open);

const old_handle = `  const handleAddLead = async () => {
    if (!leadTarget) return;
    setSubmitting(true);
    try {
      const payload = {
        sportsPlaceId: leadTarget._id,
        name: leadTarget.name,
        sportsPlaceName: leadTarget.name,
        phone: leadPhone || leadTarget.phone || '',
        alternatePhone,
        contactPerson,
        contactRole,
        sno: leadTarget.sno || '',
        district: leadTarget.district || '',
        category: leadTarget.category || 'Other',
        location: { 
          address: leadTarget.location?.address || leadTarget.address || leadTarget.name, 
          lat: leadTarget.location?.lat, 
          lng: leadTarget.location?.lng 
        },
        contactAvailability: leadTarget.contactAvailability || 'Yes',
        source: 'field',
        status: leadStatus || 'New Lead',
        leadType: leadType || 'Field Visit',
        interestLevel: interestLevel || 'Medium',
        clientRequirement,
        followUpDate: followUpDate || null,
        notes,
      };`;

const new_handle = `  const handleAddLead = async () => {
    if (!leadTarget) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        sportsPlaceId: leadTarget._id,
        sportsPlaceName: form.name,
      };
      if (payload.location) {
        payload.location.lat = leadTarget.location?.lat;
        payload.location.lng = leadTarget.location?.lng;
      }`;

content = content.replace(old_handle, new_handle);


// Now replace the form JSX
const form_regex = /\{\/\* Scrollable body \*\/\}[\s\S]*?\{\/\* View Lead Modal \(Duplicate Lead Protection\) \*\/\}/m;

const new_form_jsx = `{/* Scrollable body */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }} className="modal-form-grid">
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>R.No</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.sno} onChange={e => setForm(f => ({ ...f, sno: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Name / Place Name *</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, sportsPlaceName: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Phone *</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Email</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }} type="email"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>District</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Category</label>
                  <select style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select Category</option>
                    {['Turf', 'Football', 'Cricket', 'Sport hub/club', 'Tennis', 'Hockey', 'BasketBall', 'Volleyball', 'Badmitton', 'Academy', 'Play Ground', 'Chess', 'School/Class/Badminton', 'Skating', 'Swimming', 'Soapy Football', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Contact Available</label>
                  <select style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.contactAvailability} onChange={e => setForm(f => ({ ...f, contactAvailability: e.target.value }))}>
                    {['Yes', 'No'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Status</label>
                  <select style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {['New Lead', 'Follow Up', 'Demo Online', 'Demo Offline', 'Conversion', 'Closed', 'Rejected', 'Contacted', 'Wrong Number', 'Not Attend', 'Already have Web/App', 'Already added in Playspot', 'Interested', 'Not Interested'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Lead Type</label>
                  <select style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.leadType} onChange={e => setForm(f => ({ ...f, leadType: e.target.value }))}>
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Assigned To</label>
                  <select style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Follow Up Date</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }} type="date"
                    value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Source</label>
                  <select style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                    value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    <option value="field">Field</option>
                    <option value="online">Online</option>
                    <option value="referral">Referral</option>
                    <option value="import">Import</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Date</label>
                  <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }} type="datetime-local"
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>

              {/* Full-width fields */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Address</label>
                <input style={{ width:'100%', height:40, border:'1.5px solid #e2e8f0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
                  value={form.location?.address || ''} onChange={e => setForm(f => ({ ...f, location: { address: e.target.value } }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Client Requirement</label>
                <textarea style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box', resize: 'vertical', minHeight: 72 }} rows={3}
                  value={form.clientRequirement} onChange={e => setForm(f => ({ ...f, clientRequirement: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Notes</label>
                <textarea style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 12px', fontSize:13, fontWeight:600, color:'#1e293b', outline:'none', boxSizing:'border-box', resize: 'vertical', minHeight: 72 }} rows={3}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View Lead Modal (Duplicate Lead Protection) */}`;

content = content.replace(form_regex, new_form_jsx);

fs.writeFileSync('client/src/components/MapModule.jsx', content);
