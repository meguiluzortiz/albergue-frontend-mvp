import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { apiRequest, getAuthHeaders } from './services/api'

const initialSponsorship = {
  donorName: '',
  donorPhone: '',
  amount: '30',
  operationNumber: '',
  receipt: null,
}

const initialAdoption = {
  applicantName: '',
  applicantPhone: '',
  district: 'Comas',
  homeType: 'house',
  familyAgreement: true,
  economicStability: true,
  sterilizationCommitment: true,
  notes: '',
}

const initialAdmin = {
  email: 'admin@albergue.pe',
  password: 'Admin12345',
}

function App() {
  const [pets, setPets] = useState([])
  const [selectedPetId, setSelectedPetId] = useState('')
  const [loadingPets, setLoadingPets] = useState(false)
  const [petsError, setPetsError] = useState('')

  const [sponsorshipForm, setSponsorshipForm] = useState(initialSponsorship)
  const [sponsorshipMessage, setSponsorshipMessage] = useState('')
  const [sponsorshipLoading, setSponsorshipLoading] = useState(false)

  const [adoptionForm, setAdoptionForm] = useState(initialAdoption)
  const [adoptionMessage, setAdoptionMessage] = useState('')
  const [adoptionLoading, setAdoptionLoading] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState('')

  const [adminForm, setAdminForm] = useState(initialAdmin)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('albergue-admin-token') || '')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSponsorships, setAdminSponsorships] = useState([])
  const [adminReviewMessage, setAdminReviewMessage] = useState('')

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) || pets[0] || null,
    [pets, selectedPetId],
  )

  const fetchAdminSponsorships = useCallback(
    async (token) => {
      try {
        const data = await apiRequest('/api/v1/admin/sponsorships', {
          headers: getAuthHeaders(token),
        })
        setAdminSponsorships(data.items || [])
      } catch (error) {
        setAdminError(error.message)
      }
    },
    [],
  )

  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoadingPets(true)
        setPetsError('')

        const data = await apiRequest('/api/v1/pets')
        const items = data.items || []
        setPets(items)

        if (items.length > 0 && !selectedPetId) {
          setSelectedPetId(items[0].id)
        }
      } catch (error) {
        setPetsError(error.message)
      } finally {
        setLoadingPets(false)
      }
    }

    loadPets()
  }, [selectedPetId])

  useEffect(() => {
    if (adminToken) {
      fetchAdminSponsorships(adminToken)
    }
  }, [adminToken, fetchAdminSponsorships])

  const handleSponsorshipSubmit = async (event) => {
    event.preventDefault()
    if (!selectedPet) return

    setSponsorshipLoading(true)
    setSponsorshipMessage('')

    try {
      const payload = {
        petId: selectedPet.id,
        donorName: sponsorshipForm.donorName,
        donorPhone: sponsorshipForm.donorPhone,
        amount: Number(sponsorshipForm.amount),
        operationNumber: sponsorshipForm.operationNumber,
      }

      const data = await apiRequest('/api/v1/sponsorships', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (sponsorshipForm.receipt) {
        const formData = new FormData()
        formData.append('receipt', sponsorshipForm.receipt)

        await fetch(`${import.meta.env.VITE_API_URL || 'https://api-albergue-mvp.onrender.com'}/api/v1/sponsorships/${data.id}/receipt`, {
          method: 'POST',
          body: formData,
        })
      }

      setSponsorshipMessage(`Registro exitoso. Código: ${data.id}`)
      setSponsorshipForm(initialSponsorship)
    } catch (error) {
      setSponsorshipMessage(error.message)
    } finally {
      setSponsorshipLoading(false)
    }
  }

  const handleAdoptionSubmit = async (event) => {
    event.preventDefault()
    if (!selectedPet) return

    setAdoptionLoading(true)
    setAdoptionMessage('')
    setWhatsappLink('')

    try {
      const payload = {
        ...adoptionForm,
        petId: selectedPet.id,
        familyAgreement: Boolean(adoptionForm.familyAgreement),
        economicStability: Boolean(adoptionForm.economicStability),
        sterilizationCommitment: Boolean(adoptionForm.sterilizationCommitment),
      }

      const created = await apiRequest('/api/v1/adoptions/pre-evaluations', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const whatsappData = await apiRequest(`/api/v1/adoptions/pre-evaluations/${created.id}/whatsapp-link`)
      setWhatsappLink(whatsappData.whatsappLink || whatsappData.link || '')
      setAdoptionMessage(`Preevaluación enviada correctamente. ID: ${created.id}`)
      setAdoptionForm(initialAdoption)
    } catch (error) {
      setAdoptionMessage(error.message)
    } finally {
      setAdoptionLoading(false)
    }
  }

  const handleAdminLogin = async (event) => {
    event.preventDefault()
    setAdminLoading(true)
    setAdminError('')

    try {
      const data = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminForm),
      })

      localStorage.setItem('albergue-admin-token', data.accessToken)
      setAdminToken(data.accessToken)
    } catch (error) {
      setAdminError(error.message)
    } finally {
      setAdminLoading(false)
    }
  }

  const handleAdminReview = async (id, action) => {
    try {
      const data = await apiRequest(`/api/v1/admin/sponsorships/${id}/review`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify({
          action,
          note: action === 'approve' ? 'Comprobante validado desde la UI MVP.' : 'Comprobante rechazado desde la UI MVP.',
        }),
      })

      setAdminReviewMessage(`Comprobante ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente.`)
      if (data) {
        fetchAdminSponsorships(adminToken)
      }
    } catch (error) {
      setAdminReviewMessage(error.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Albergue Lima Norte</p>
          <h1>Catálogo y padrinazgo</h1>
        </div>
        <span className="badge">MVP Frontend</span>
      </header>

      <main className="content-grid">
        <section className="card public-panel">
          <div className="section-header">
            <h2>Mascotas disponibles</h2>
            <span>{pets.length} registros</span>
          </div>

          {loadingPets ? <p>Cargando mascotas...</p> : null}
          {petsError ? <p className="alert error">{petsError}</p> : null}

          <div className="pet-list">
            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                className={`pet-card ${selectedPet?.id === pet.id ? 'active' : ''}`}
                onClick={() => setSelectedPetId(pet.id)}
              >
                <img
                  src={pet.photoUrl || 'https://placehold.co/600x400/ede9fe/4c1d95?text=Mascota'}
                  alt={pet.name}
                  onError={(event) => {
                    event.currentTarget.src = 'https://placehold.co/600x400/ede9fe/4c1d95?text=Mascota'
                  }}
                />
                <div className="pet-meta">
                  <strong>{pet.name}</strong>
                  <span>{pet.species === 'dog' ? 'Perro' : 'Gato'} • {pet.sex === 'male' ? 'Macho' : 'Hembra'}</span>
                  <small>{pet.ageMonths} meses • {pet.status}</small>
                </div>
              </button>
            ))}
          </div>

          {selectedPet ? (
            <div className="pet-detail">
              <h3>{selectedPet.name}</h3>
              <p>
                {selectedPet.species === 'dog' ? 'Perro' : 'Gato'} • {selectedPet.ageMonths} meses • {selectedPet.status}
              </p>
              <p>Padrinazgo mensual sugerido: S/ {selectedPet.sponsorshipMonthlyAmount ?? 30}</p>
            </div>
          ) : null}
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Apadrinar</h2>
          </div>

          <form onSubmit={handleSponsorshipSubmit} className="stack-form">
            <label>
              Nombre completo
              <input
                type="text"
                value={sponsorshipForm.donorName}
                onChange={(event) => setSponsorshipForm({ ...sponsorshipForm, donorName: event.target.value })}
                required
              />
            </label>

            <label>
              Teléfono / WhatsApp
              <input
                type="text"
                value={sponsorshipForm.donorPhone}
                onChange={(event) => setSponsorshipForm({ ...sponsorshipForm, donorPhone: event.target.value })}
                required
              />
            </label>

            <div className="inline-fields">
              <label>
                Monto (S/)
                <input
                  type="number"
                  min="1"
                  value={sponsorshipForm.amount}
                  onChange={(event) => setSponsorshipForm({ ...sponsorshipForm, amount: event.target.value })}
                  required
                />
              </label>

              <label>
                N° operación
                <input
                  type="text"
                  value={sponsorshipForm.operationNumber}
                  onChange={(event) => setSponsorshipForm({ ...sponsorshipForm, operationNumber: event.target.value })}
                  required
                />
              </label>
            </div>

            <label>
              Comprobante (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setSponsorshipForm({
                    ...sponsorshipForm,
                    receipt: event.target.files?.[0] || null,
                  })
                }
              />
            </label>

            <button className="primary-btn" type="submit" disabled={sponsorshipLoading || !selectedPet}>
              {sponsorshipLoading ? 'Enviando...' : 'Registrar apadrinamiento'}
            </button>
            {sponsorshipMessage ? <p className="alert success">{sponsorshipMessage}</p> : null}
          </form>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Preevaluación de adopción</h2>
          </div>

          <form onSubmit={handleAdoptionSubmit} className="stack-form">
            <label>
              Nombre del postulante
              <input
                type="text"
                value={adoptionForm.applicantName}
                onChange={(event) => setAdoptionForm({ ...adoptionForm, applicantName: event.target.value })}
                required
              />
            </label>

            <label>
              Teléfono
              <input
                type="text"
                value={adoptionForm.applicantPhone}
                onChange={(event) => setAdoptionForm({ ...adoptionForm, applicantPhone: event.target.value })}
                required
              />
            </label>

            <div className="inline-fields">
              <label>
                Distrito
                <input
                  type="text"
                  value={adoptionForm.district}
                  onChange={(event) => setAdoptionForm({ ...adoptionForm, district: event.target.value })}
                  required
                />
              </label>

              <label>
                Tipo de vivienda
                <select
                  value={adoptionForm.homeType}
                  onChange={(event) => setAdoptionForm({ ...adoptionForm, homeType: event.target.value })}
                >
                  <option value="house">Casa</option>
                  <option value="apartment">Departamento</option>
                  <option value="other">Otro</option>
                </select>
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={adoptionForm.familyAgreement}
                onChange={(event) => setAdoptionForm({ ...adoptionForm, familyAgreement: event.target.checked })}
              />
              Acuerdo familiar
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={adoptionForm.economicStability}
                onChange={(event) => setAdoptionForm({ ...adoptionForm, economicStability: event.target.checked })}
              />
              Estabilidad económica
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={adoptionForm.sterilizationCommitment}
                onChange={(event) => setAdoptionForm({ ...adoptionForm, sterilizationCommitment: event.target.checked })}
              />
              Compromiso de esterilización
            </label>

            <label>
              Notas
              <textarea
                rows="3"
                value={adoptionForm.notes}
                onChange={(event) => setAdoptionForm({ ...adoptionForm, notes: event.target.value })}
              />
            </label>

            <button className="primary-btn" type="submit" disabled={adoptionLoading || !selectedPet}>
              {adoptionLoading ? 'Procesando...' : 'Enviar preevaluación'}
            </button>
            {adoptionMessage ? <p className="alert success">{adoptionMessage}</p> : null}
            {whatsappLink ? (
              <a className="whatsapp-link" href={whatsappLink} target="_blank" rel="noreferrer">
                Abrir WhatsApp
              </a>
            ) : null}
          </form>
        </section>

        <section className="card admin-panel">
          <div className="section-header">
            <h2>Panel admin</h2>
          </div>

          {!adminToken ? (
            <form onSubmit={handleAdminLogin} className="stack-form">
              <label>
                Email
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })}
                  required
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
                  required
                />
              </label>

              <button className="primary-btn" type="submit" disabled={adminLoading}>
                {adminLoading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
              {adminError ? <p className="alert error">{adminError}</p> : null}
            </form>
          ) : (
            <>
              <div className="admin-actions">
                <strong>Sesión activa</strong>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    localStorage.removeItem('albergue-admin-token')
                    setAdminToken('')
                    setAdminSponsorships([])
                  }}
                >
                  Cerrar sesión
                </button>
              </div>

              <div className="admin-list">
                {adminSponsorships.length === 0 ? (
                  <p>No hay comprobantes para revisar.</p>
                ) : (
                  adminSponsorships.map((item) => (
                    <article key={item.id} className="admin-item">
                      <div>
                        <strong>{item.donorName}</strong>
                        <p>{item.petId}</p>
                        <p>Monto: S/ {item.amount}</p>
                        <p>Estado: {item.status}</p>
                      </div>

                      <div className="admin-actions-row">
                        <button type="button" className="success-btn" onClick={() => handleAdminReview(item.id, 'approve')}>
                          Aprobar
                        </button>
                        <button type="button" className="danger-btn" onClick={() => handleAdminReview(item.id, 'reject')}>
                          Rechazar
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {adminReviewMessage ? <p className="alert success">{adminReviewMessage}</p> : null}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
