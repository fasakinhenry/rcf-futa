import { useState, useEffect, useRef, useMemo } from 'react';
import {
  SearchIcon,
  UserAddIcon,
  CancelIcon,
  CheckCircleIcon,
  UploadIcon,
  MailIcon,
} from '../lib/icons.jsx';
import {
  fetchApprovedStudents,
  submitStudent,
  fetchUnits,
  LEVELS,
} from '../lib/api.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';
import './Gallery.css';

const AVATAR_COLORS = [
  '#1a5c38',
  '#134429',
  '#1e4d8c',
  '#6b2f8c',
  '#8c2f2f',
  '#5c4a1a',
  '#1a4d5c',
  '#5c1a4a',
];

function StudentCard({ student }) {
  const initials = student.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  const colorIdx = student.name.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <div className='student-card'>
      <div
        className='student-card__avatar'
        style={{ background: AVATAR_COLORS[colorIdx] }}
      >
        {student.image_url ? (
          <img src={student.image_url} alt={student.name} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className='student-card__body'>
        <h3 className='student-card__name'>{student.name}</h3>
        <p className='student-card__dept'>{student.department}</p>
        <div className='student-card__tags'>
          <span className='tag tag--dark'>{student.level}L</span>
          <span className='tag tag--green'>{student.units?.name || '—'}</span>
        </div>
        {student.hobbies && (
          <p className='student-card__hobbies'>
            <strong>Interests:</strong> {student.hobbies}
          </p>
        )}
      </div>
    </div>
  );
}

function AddProfileModal({ units, onClose, onSuccess }) {
  const savedEmail = localStorage.getItem('rcf_email') || '';
  const [form, setForm] = useState({
    name: '',
    email: savedEmail,
    department: '',
    level: '',
    hobbies: '',
    unit_id: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: 'Max file size is 5MB' }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, image: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (
      !savedEmail &&
      (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    )
      e.email = 'A valid email is required';
    if (!form.department.trim()) e.department = 'Department is required';
    if (!form.level) e.level = 'Select your level';
    if (!form.unit_id) e.unit_id = 'Select your unit';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      let image_url = null,
        image_public_id = null;
      if (imageFile) {
        setUploading(true);
        const result = await uploadToCloudinary(
          imageFile,
          'image',
          setUploadProgress,
        );
        image_url = result.url;
        image_public_id = result.public_id;
        setUploading(false);
      }
      const cleanedEmail = (savedEmail || form.email).trim().toLowerCase();
      await submitStudent({
        ...form,
        email: cleanedEmail,
        image_url,
        image_public_id,
      });
      localStorage.setItem('rcf_email', cleanedEmail);
      setDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch (err) {
      setErrors({ submit: err.message || 'Submission failed. Try again.' });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className='modal-overlay'>
        <div className='modal modal--sm'>
          <div className='modal__success'>
            <CheckCircleIcon size={48} />
            <h3>Profile Submitted!</h3>
            <p>
              Your profile is pending admin approval. You'll appear in the
              gallery once approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='modal-overlay'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <div className='modal__header'>
          <h2>Add Your Profile</h2>
          <button className='modal__close' onClick={onClose}>
            <CancelIcon size={16} />
          </button>
        </div>
        <p className='modal__subtitle'>
          Requires admin approval before appearing in the gallery.
        </p>

        <div className='modal__body'>
          {/* Photo upload */}
          <div className='field field--center'>
            <div
              className='avatar-upload'
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt='Preview' />
              ) : (
                <>
                  <UploadIcon size={22} />
                  <span>Upload Photo</span>
                </>
              )}
              {uploading && (
                <div className='avatar-upload__progress'>
                  <div style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
            <input
              type='file'
              ref={fileRef}
              accept='image/jpeg,image/png,image/webp'
              onChange={handleImage}
              style={{ display: 'none' }}
            />
            {errors.image && <p className='form-error'>{errors.image}</p>}
            <p className='form-hint'>Optional · JPG, PNG, WebP · Max 5MB</p>
          </div>

          <div className='field'>
            <label>Email Address {savedEmail ? '(saved)' : '*'}</label>
            <div className='input-with-icon'>
              <MailIcon size={14} />
              <input
                className={`input ${errors.email ? 'error' : ''}`}
                type='email'
                placeholder='you@example.com'
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                readOnly={Boolean(savedEmail)}
              />
            </div>
            {savedEmail && (
              <p className='form-hint'>
                Using the email saved from the notification bell.
              </p>
            )}
            {errors.email && <p className='form-error'>{errors.email}</p>}
          </div>

          <div className='form-row'>
            <div className='field'>
              <label>Full Name *</label>
              <input
                className={`input ${errors.name ? 'error' : ''}`}
                placeholder='e.g. Adaeze Okonkwo'
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              {errors.name && <p className='form-error'>{errors.name}</p>}
            </div>
            <div className='field'>
              <label>Department *</label>
              <input
                className={`input ${errors.department ? 'error' : ''}`}
                placeholder='e.g. Computer Science'
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
              />
              {errors.department && (
                <p className='form-error'>{errors.department}</p>
              )}
            </div>
          </div>

          <div className='form-row'>
            <div className='field'>
              <label>Level *</label>
              <div className='select-wrap'>
                <select
                  className={errors.level ? 'error' : ''}
                  value={form.level}
                  onChange={(e) => set('level', e.target.value)}
                >
                  <option value=''>Select level</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l} Level
                    </option>
                  ))}
                </select>
                <span className='select-icon'>▾</span>
              </div>
              {errors.level && <p className='form-error'>{errors.level}</p>}
            </div>
            <div className='field'>
              <label>Preferred Unit *</label>
              <div className='select-wrap'>
                <select
                  className={errors.unit_id ? 'error' : ''}
                  value={form.unit_id}
                  onChange={(e) => set('unit_id', e.target.value)}
                >
                  <option value=''>Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <span className='select-icon'>▾</span>
              </div>
              {errors.unit_id && <p className='form-error'>{errors.unit_id}</p>}
            </div>
          </div>

          <div className='field'>
            <label>Hobbies & Interests</label>
            <input
              className='input'
              placeholder='e.g. Reading, Football, Singing'
              value={form.hobbies}
              onChange={(e) => set('hobbies', e.target.value)}
            />
          </div>

          {errors.submit && <p className='form-error'>{errors.submit}</p>}
        </div>

        <div className='modal__footer'>
          <button className='btn btn--outline' onClick={onClose}>
            Cancel
          </button>
          <button
            className='btn btn--primary'
            onClick={handleSubmit}
            disabled={saving || uploading}
          >
            {uploading
              ? `Uploading ${uploadProgress}%…`
              : saving
                ? 'Submitting…'
                : 'Submit Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [students, setStudents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        fetchApprovedStudents({
          search,
          unitId: filterUnit,
          level: filterLevel,
        }),
        fetchUnits(),
      ]);
      setStudents(s);
      setUnits(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, filterUnit, filterLevel]);

  const hasFilters = search || filterUnit || filterLevel;

  return (
    <main className='gallery'>
      <div className='gallery__header grid-bg'>
        <div className='container'>
          <div className='eyebrow'>Workers in Training</div>
          <div className='gallery__header-row'>
            <h1 className='heading-lg'>The Cohort</h1>
            <button
              className='btn btn--primary'
              onClick={() => setShowModal(true)}
            >
              <UserAddIcon size={16} /> Add My Profile
            </button>
          </div>
          <p className='gallery__sub'>
            Meet the students being trained and equipped for ministry at RCF
            FUTA.
          </p>
        </div>
      </div>

      <div className='gallery__controls'>
        <div className='gallery__search'>
          <SearchIcon size={16} />
          <input
            placeholder='Search by name, department, hobbies...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <CancelIcon size={14} />
            </button>
          )}
        </div>

        <div className='gallery__filters'>
          <div className='select-wrap select-wrap--sm'>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
            >
              <option value=''>All Units</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <span className='select-icon'>▾</span>
          </div>
          <div className='select-wrap select-wrap--sm'>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value=''>All Levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}L
                </option>
              ))}
            </select>
            <span className='select-icon'>▾</span>
          </div>
          {hasFilters && (
            <button
              className='btn btn--outline btn--sm'
              onClick={() => {
                setSearch('');
                setFilterUnit('');
                setFilterLevel('');
              }}
            >
              <CancelIcon size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className='gallery__meta container'>
        <span className='label'>
          {loading
            ? 'Loading…'
            : `${students.length} student${students.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className='container gallery__grid-wrap'>
        {loading ? (
          <div className='gallery__loading'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='skeleton-card' />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className='empty-state'>
            <div className='empty-state__icon'>
              <UserAddIcon size={24} />
            </div>
            <p>No students found</p>
            <span>
              {hasFilters
                ? 'Try adjusting your filters'
                : 'Be the first to add your profile'}
            </span>
            <button
              className='btn btn--primary'
              onClick={() => setShowModal(true)}
            >
              Add My Profile
            </button>
          </div>
        ) : (
          <div className='gallery__grid'>
            {students.map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 80 }} />

      {showModal && (
        <AddProfileModal
          units={units}
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </main>
  );
}
