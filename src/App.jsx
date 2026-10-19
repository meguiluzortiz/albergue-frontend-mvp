import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
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

const initialPetForm = {
  name: '',
  species: 'dog',
  sex: 'male',
  ageMonths: 12,
  status: 'available',
  sponsorshipMonthlyAmount: '30',
  photoUrl: '',
}

function App() {
  const [pets, setPets] = useState([])
  const [selectedPetId, setSelectedPetId] = useState('')
  const [loadingPets, setLoadingPets] = useState(false)
  const [petsError, setPetsError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const petsPerPage = 5

  const [sponsorshipForm, setSponsorshipForm] = useState(initialSponsorship)
  const [sponsorshipMessage, setSponsorshipMessage] = useState('')
  const [sponsorshipLoading, setSponsorshipLoading] = useState(false)

  const [adoptionForm, setAdoptionForm] = useState(initialAdoption)
  const [adoptionMessage, setAdoptionMessage] = useState('')
  const [adoptionLoading, setAdoptionLoading] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState('')
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false)
  const [adoptionModalOpen, setAdoptionModalOpen] = useState(false)

  const [adminForm, setAdminForm] = useState(initialAdmin)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('albergue-admin-token') || '')
  const [adminView, setAdminView] = useState('mascotas')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSponsorships, setAdminSponsorships] = useState([])
  const [adminPets, setAdminPets] = useState([])
  const [adminAdoptions, setAdminAdoptions] = useState([])
  const [adminPetDetail, setAdminPetDetail] = useState(null)
  const [sponsorshipDetail, setSponsorshipDetail] = useState(null)
  const [adoptionDetail, setAdoptionDetail] = useState(null)
  const [petForm, setPetForm] = useState(initialPetForm)
  const [petEditingId, setPetEditingId] = useState(null)
  const [petFormMessage, setPetFormMessage] = useState('')
  const [petFormLoading, setPetFormLoading] = useState(false)
  const [petModalOpen, setPetModalOpen] = useState(false)
  const [petDetailModalOpen, setPetDetailModalOpen] = useState(false)
  const [sponsorshipDetailModalOpen, setSponsorshipDetailModalOpen] = useState(false)
  const [adoptionDetailModalOpen, setAdoptionDetailModalOpen] = useState(false)
  const [adminReviewMessage, setAdminReviewMessage] = useState('')

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) || pets[0] || null,
    [pets, selectedPetId],
  )

  const totalPages = Math.max(1, Math.ceil(pets.length / petsPerPage))
  const paginatedPets = useMemo(
    () => pets.slice((currentPage - 1) * petsPerPage, currentPage * petsPerPage),
    [pets, currentPage],
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

  const fetchAdminPets = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/pets')
      setAdminPets(data.items || [])
    } catch (error) {
      setAdminError(error.message)
    }
  }, [])

  const fetchAdminAdoptions = useCallback(
    async (token) => {
      try {
        const data = await apiRequest('/api/v1/admin/pre-evaluations', {
          headers: getAuthHeaders(token),
        })
        setAdminAdoptions(data.items || [])
      } catch (error) {
        setAdminError(error.message)
      }
    },
    [],
  )

  const loadPetDetail = useCallback(async (petId) => {
    try {
      const data = await apiRequest(`/api/v1/pets/${petId}`)
      setAdminPetDetail(data)
      setPetDetailModalOpen(true)
    } catch (error) {
      setPetFormMessage(error.message)
    }
  }, [])

  const loadSponsorshipDetail = useCallback(async (sponsorshipId) => {
    try {
      const data = await apiRequest(`/api/v1/admin/sponsorships/${sponsorshipId}`, {
        headers: getAuthHeaders(adminToken),
      })
      setSponsorshipDetail(data)
      setSponsorshipDetailModalOpen(true)
    } catch (error) {
      setAdminReviewMessage(error.message)
    }
  }, [adminToken])

  const loadAdoptionDetail = useCallback(async (preEvaluationId) => {
    try {
      const data = await apiRequest(`/api/v1/admin/pre-evaluations/${preEvaluationId}`, {
        headers: getAuthHeaders(adminToken),
      })
      setAdoptionDetail(data)
      setAdoptionDetailModalOpen(true)
    } catch (error) {
      setAdminReviewMessage(error.message)
    }
  }, [adminToken])

  const openCreatePetModal = () => {
    setPetEditingId(null)
    setPetForm(initialPetForm)
    setPetFormMessage('')
    setPetModalOpen(true)
  }

  const openEditPetModal = (pet) => {
    setPetEditingId(pet.id)
    setPetForm({
      name: pet.name,
      species: pet.species,
      sex: pet.sex,
      ageMonths: pet.ageMonths,
      status: pet.status,
      sponsorshipMonthlyAmount: String(pet.sponsorshipMonthlyAmount ?? ''),
      photoUrl: pet.photoUrl || '',
    })
    setPetFormMessage('')
    setPetModalOpen(true)
  }

  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoadingPets(true)
        setPetsError('')

        const data = await apiRequest('/api/v1/pets')
        const items = data.items || []
        setPets(items)
      } catch (error) {
        setPetsError(error.message)
      } finally {
        setLoadingPets(false)
      }
    }

    loadPets()
  }, [])

  useEffect(() => {
    if (!selectedPetId && pets.length > 0) {
      setSelectedPetId(pets[0].id)
    }
  }, [pets, selectedPetId])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (adminToken) {
      fetchAdminSponsorships(adminToken)
      fetchAdminPets()
      fetchAdminAdoptions(adminToken)
    }
  }, [adminToken, fetchAdminAdoptions, fetchAdminPets, fetchAdminSponsorships])

  const handlePetSubmit = async (event) => {
    event.preventDefault()
    setPetFormLoading(true)
    setPetFormMessage('')

    try {
      const payload = {
        name: petForm.name.trim(),
        species: petForm.species,
        sex: petForm.sex,
        ageMonths: Number(petForm.ageMonths),
        status: petForm.status,
        sponsorshipMonthlyAmount: petForm.sponsorshipMonthlyAmount ? Number(petForm.sponsorshipMonthlyAmount) : undefined,
        photoUrl: petForm.photoUrl.trim() || undefined,
      }

      if (petEditingId) {
        await apiRequest(`/api/v1/admin/pets/${petEditingId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(adminToken),
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('/api/v1/admin/pets', {
          method: 'POST',
          headers: getAuthHeaders(adminToken),
          body: JSON.stringify(payload),
        })
      }

      const successMessage = petEditingId ? 'Mascota actualizada correctamente.' : 'Mascota creada correctamente.'
      setPetFormMessage(successMessage)
      setPetForm(initialPetForm)
      setPetEditingId(null)
      setPetModalOpen(false)
      fetchAdminPets()
    } catch (error) {
      setPetFormMessage(error.message)
    } finally {
      setPetFormLoading(false)
    }
  }

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

        await fetch(`${API_URL}/api/v1/sponsorships/${data.id}/receipt`, {
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
      const nextWhatsappLink = whatsappData.whatsappLink || whatsappData.whatsappUrl || whatsappData.link || ''
      setWhatsappLink(nextWhatsappLink)
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

  const handleAdoptionAdminReview = async (id, action) => {
    try {
      const data = await apiRequest(`/api/v1/admin/pre-evaluations/${id}/review`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(adminToken),
        },
        body: JSON.stringify({
          action,
          note: action === 'approve' ? 'Solicitud de adopción aprobada desde la UI MVP.' : 'Solicitud de adopción rechazada desde la UI MVP.',
        }),
      })

      setAdminReviewMessage(`Solicitud de adopción ${action === 'approve' ? 'aprobada' : 'rechazada'} correctamente.`)
      if (data) {
        fetchAdminAdoptions(adminToken)
      }
    } catch (error) {
      setAdminReviewMessage(error.message)
    }
  }

  const renderCatalogPage = () => (
    <main className="content-grid">
      <section className="card public-panel">
        <div className="section-header">
          <h2>Mascotas disponibles</h2>
          <span>{pets.length} registros</span>
        </div>

        {loadingPets ? <p>Cargando mascotas...</p> : null}
        {petsError ? <p className="alert error">{petsError}</p> : null}

        <div className="pet-list">
          {paginatedPets.map((pet) => {
            const description = `${pet.species === 'dog' ? 'Perro' : 'Gato'} ${pet.sex === 'male' ? 'macho' : 'hembra'} de ${pet.ageMonths} meses. Ideal para hogares con energía y cariño.`

            return (
              <article
                key={pet.id}
                className="pet-card"
              >
                <img
                  src={pet.photoUrl || 'https://placehold.co/600x400/ede9fe/4c1d95?text=Mascota'}
                  alt={pet.name}
                  onError={(event) => {
                    event.currentTarget.src = 'https://placehold.co/600x400/ede9fe/4c1d95?text=Mascota'
                  }}
                />

                <div className="pet-body">
                  <div className="pet-meta">
                    <strong>{pet.name}</strong>
                    <span>{pet.species === 'dog' ? 'Perro' : 'Gato'} • {pet.sex === 'male' ? 'Macho' : 'Hembra'}</span>
                    <small>{pet.ageMonths} meses • {pet.status}</small>
                  </div>

                  <p className="pet-description">{description}</p>

                  <div className="pet-actions-inline">
                    <button
                      type="button"
                      className="primary-btn pet-action-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedPetId(pet.id)
                        setSponsorModalOpen(true)
                      }}
                    >
                      Apadrinar
                    </button>
                    <button
                      type="button"
                      className="secondary-btn pet-action-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedPetId(pet.id)
                        setAdoptionModalOpen(true)
                      }}
                    >
                      Adopción
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {pets.length > 0 ? (
          <div className="pagination">
            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </section>

      {sponsorModalOpen && selectedPet ? (
        <div className="modal-overlay" onClick={() => setSponsorModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow modal-eyebrow">Apadrinar</p>
                <h3>{selectedPet.name}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setSponsorModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
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

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={() => setSponsorModalOpen(false)}>
                    Cancelar
                  </button>
                  <button className="primary-btn" type="submit" disabled={sponsorshipLoading || !selectedPet}>
                    {sponsorshipLoading ? 'Enviando...' : 'Registrar apadrinamiento'}
                  </button>
                </div>
                {sponsorshipMessage ? <p className="alert success">{sponsorshipMessage}</p> : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {adoptionModalOpen && selectedPet ? (
        <div className="modal-overlay" onClick={() => setAdoptionModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow modal-eyebrow">Adopción</p>
                <h3>{selectedPet.name}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setAdoptionModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
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

                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={() => setAdoptionModalOpen(false)}>
                    Cancelar
                  </button>
                  <button className="primary-btn" type="submit" disabled={adoptionLoading || !selectedPet}>
                    {adoptionLoading ? 'Procesando...' : 'Enviar preevaluación'}
                  </button>
                </div>
                {adoptionMessage ? <p className="alert success">{adoptionMessage}</p> : null}
                {whatsappLink ? (
                  <a className="whatsapp-link" href={whatsappLink} target="_blank" rel="noreferrer">
                    Abrir WhatsApp
                  </a>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )

  const renderSponsorPage = () => (
    <main className="content-grid">
      <section className="card">
        <div className="section-header">
          <h2>Apadrinar</h2>
        </div>

        {selectedPet ? (
          <div className="selection-banner">
            <span className="selection-label">Mascota seleccionada</span>
            <strong>{selectedPet.name}</strong>
          </div>
        ) : null}

        <form onSubmit={handleSponsorshipSubmit} className="stack-form section-form">
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
    </main>
  )

  const renderAdoptionPage = () => (
    <main className="content-grid">
      <section className="card">
        <div className="section-header">
          <h2>Preevaluación de adopción</h2>
        </div>

        {selectedPet ? (
          <div className="selection-banner">
            <span className="selection-label">Animal de interés</span>
            <strong>{selectedPet.name}</strong>
          </div>
        ) : null}

        <form onSubmit={handleAdoptionSubmit} className="stack-form section-form">
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
    </main>
  )

  const renderAdminPage = () => (
    <main className="content-grid">
      <section className="card admin-panel">
        <div className="section-header">
          <h2>Panel admin</h2>
        </div>

        {!adminToken ? (
          <form onSubmit={handleAdminLogin} className="stack-form section-form">
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
          <div className="admin-layout">
            <aside className="admin-sidebar">
              <div className="admin-sidebar-header">
                <strong>Administración</strong>
              </div>

              <button
                type="button"
                className={`admin-sidebar-btn ${adminView === 'mascotas' ? 'active' : ''}`}
                onClick={() => setAdminView('mascotas')}
              >
                Mascotas
              </button>

              <button
                type="button"
                className={`admin-sidebar-btn ${adminView === 'donaciones' ? 'active' : ''}`}
                onClick={() => setAdminView('donaciones')}
              >
                Donaciones
              </button>

              <button
                type="button"
                className={`admin-sidebar-btn ${adminView === 'adopciones' ? 'active' : ''}`}
                onClick={() => setAdminView('adopciones')}
              >
                Adopciones
              </button>

              <button
                type="button"
                className="secondary-btn admin-logout-btn"
                onClick={() => {
                  localStorage.removeItem('albergue-admin-token')
                  setAdminToken('')
                  setAdminSponsorships([])
                  setAdminPets([])
                  setAdminAdoptions([])
                  setAdminPetDetail(null)
                  setSponsorshipDetail(null)
                  setAdoptionDetail(null)
                  setAdminView('mascotas')
                }}
              >
                Cerrar sesión
              </button>
            </aside>

            <div className="admin-main-panel">
              {adminView === 'mascotas' ? (
                <div className="admin-section">
                  <div className="admin-section-header">
                    <h3>Listado de mascotas</h3>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={openCreatePetModal}
                    >
                      + Nueva mascota
                    </button>
                  </div>

                  <p className="admin-section-description">
                    Aquí puedes administrar el catálogo del albergue: registrar nuevas mascotas, editar su información,
                    actualizar su estado y revisar el detalle de cada animal disponible, apadrinado o adoptado.
                  </p>

                  {petFormMessage ? <p className="alert success">{petFormMessage}</p> : null}

                  <div className="admin-pet-list">
                    {adminPets.length === 0 ? (
                      <p className="admin-empty-state">No hay mascotas registradas.</p>
                    ) : (
                      adminPets.map((pet) => (
                        <article key={pet.id} className="admin-pet-item">
                          <div className="admin-pet-info">
                            <strong>{pet.name}</strong>
                            <span>{pet.species === 'dog' ? 'Perro' : 'Gato'} • {pet.sex === 'male' ? 'Macho' : 'Hembra'}</span>
                            <small>{pet.ageMonths} meses • {pet.status}</small>
                          </div>

                          <div className="admin-actions-row">
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => openEditPetModal(pet)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="primary-btn"
                              onClick={() => loadPetDetail(pet.id)}
                            >
                              Detalle
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  {petModalOpen ? (
                    <div className="modal-overlay" onClick={() => setPetModalOpen(false)}>
                      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                          <div>
                            <p className="modal-eyebrow">Mascotas</p>
                            <h3>{petEditingId ? 'Editar mascota' : 'Nueva mascota'}</h3>
                          </div>
                          <button
                            type="button"
                            className="modal-close"
                            aria-label="Cerrar"
                            onClick={() => setPetModalOpen(false)}
                          >
                            ×
                          </button>
                        </div>

                        <div className="modal-body">
                          <form onSubmit={handlePetSubmit} className="stack-form">
                            <div className="inline-fields">
                              <label>
                                Nombre
                                <input
                                  type="text"
                                  value={petForm.name}
                                  onChange={(event) => setPetForm({ ...petForm, name: event.target.value })}
                                  required
                                />
                              </label>

                              <label>
                                Edad (meses)
                                <input
                                  type="number"
                                  min="0"
                                  value={petForm.ageMonths}
                                  onChange={(event) => setPetForm({ ...petForm, ageMonths: event.target.value })}
                                  required
                                />
                              </label>
                            </div>

                            <div className="inline-fields">
                              <label>
                                Especie
                                <select
                                  value={petForm.species}
                                  onChange={(event) => setPetForm({ ...petForm, species: event.target.value })}
                                >
                                  <option value="dog">Perro</option>
                                  <option value="cat">Gato</option>
                                </select>
                              </label>

                              <label>
                                Sexo
                                <select
                                  value={petForm.sex}
                                  onChange={(event) => setPetForm({ ...petForm, sex: event.target.value })}
                                >
                                  <option value="male">Macho</option>
                                  <option value="female">Hembra</option>
                                </select>
                              </label>
                            </div>

                            <div className="inline-fields">
                              <label>
                                Estado
                                <select
                                  value={petForm.status}
                                  onChange={(event) => setPetForm({ ...petForm, status: event.target.value })}
                                >
                                  <option value="available">Disponible</option>
                                  <option value="sponsored">Apadrinado</option>
                                  <option value="adopted">Adoptado</option>
                                </select>
                              </label>

                              <label>
                                Apadrinamiento mensual (S/)
                                <input
                                  type="number"
                                  min="1"
                                  value={petForm.sponsorshipMonthlyAmount}
                                  onChange={(event) => setPetForm({ ...petForm, sponsorshipMonthlyAmount: event.target.value })}
                                />
                              </label>
                            </div>

                            <label>
                              URL de foto
                              <input
                                type="url"
                                value={petForm.photoUrl}
                                onChange={(event) => setPetForm({ ...petForm, photoUrl: event.target.value })}
                                placeholder="https://example.com/imagen.jpg"
                              />
                            </label>

                            <div className="modal-actions">
                              <button type="button" className="secondary-btn" onClick={() => setPetModalOpen(false)}>
                                Cancelar
                              </button>
                              <button className="primary-btn" type="submit" disabled={petFormLoading}>
                                {petFormLoading ? 'Guardando...' : petEditingId ? 'Actualizar' : 'Crear'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {petDetailModalOpen && adminPetDetail ? (
                    <div className="modal-overlay" onClick={() => setPetDetailModalOpen(false)}>
                      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                          <div>
                            <p className="modal-eyebrow">Detalle</p>
                            <h3>{adminPetDetail.name}</h3>
                          </div>
                          <button
                            type="button"
                            className="modal-close"
                            aria-label="Cerrar detalle"
                            onClick={() => setPetDetailModalOpen(false)}
                          >
                            ×
                          </button>
                        </div>

                        <div className="modal-body">
                          <div className="admin-detail-grid">
                            <div>
                              <p><strong>Especie:</strong> {adminPetDetail.species === 'dog' ? 'Perro' : 'Gato'}</p>
                              <p><strong>Sexo:</strong> {adminPetDetail.sex === 'male' ? 'Macho' : 'Hembra'}</p>
                              <p><strong>Edad:</strong> {adminPetDetail.ageMonths} meses</p>
                            </div>
                            <div>
                              <p><strong>Estado:</strong> {adminPetDetail.status}</p>
                              <p><strong>Apadrinamiento:</strong> S/ {adminPetDetail.sponsorshipMonthlyAmount ?? 0}</p>
                              <p><strong>Disponibilidad:</strong> {adminPetDetail.status === 'available' ? 'Disponible' : adminPetDetail.status === 'sponsored' ? 'Apadrinado' : 'Adoptado'}</p>
                            </div>
                          </div>

                          {adminPetDetail.photoUrl ? (
                            <img className="admin-detail-image" src={adminPetDetail.photoUrl} alt={adminPetDetail.name} />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : adminView === 'donaciones' ? (
                <div className="admin-section">
                  <div className="admin-section-header">
                    <h3>Donaciones</h3>
                  </div>

                  <p className="admin-section-description">
                    Este módulo permite revisar los registros de apoyo económico enviados por los padrinos. Puedes validar
                    el monto, verificar el comprobante de pago y aprobar o rechazar cada donación según corresponda.
                  </p>

                  <div className="admin-list">
                    {adminSponsorships.length === 0 ? (
                      <p className="admin-empty-state">No hay donaciones para revisar.</p>
                    ) : (
                      adminSponsorships.map((item) => (
                        <article key={item.id} className="admin-item">
                          <div className="admin-meta">
                            <div className="admin-meta-header">
                              <strong>{item.donorName}</strong>
                              <span className="status-pill">{item.status}</span>
                            </div>
                            <p>{item.petId}</p>
                            <p>Monto: S/ {item.amount}</p>
                          </div>

                          <div className="admin-actions-row">
                            <button type="button" className="secondary-btn" onClick={() => loadSponsorshipDetail(item.id)}>
                              Detalle
                            </button>
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

                  {sponsorshipDetailModalOpen && sponsorshipDetail ? (
                    <div className="modal-overlay" onClick={() => setSponsorshipDetailModalOpen(false)}>
                      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                          <div>
                            <p className="modal-eyebrow">Detalle</p>
                            <h3>Donación de apadrinamiento</h3>
                          </div>
                          <button
                            type="button"
                            className="modal-close"
                            aria-label="Cerrar detalle"
                            onClick={() => setSponsorshipDetailModalOpen(false)}
                          >
                            ×
                          </button>
                        </div>

                        <div className="modal-body">
                          <div className="admin-detail-grid">
                            <div>
                              <p><strong>ID:</strong> {sponsorshipDetail.id}</p>
                              <p><strong>Donante:</strong> {sponsorshipDetail.donorName}</p>
                              <p><strong>Teléfono:</strong> {sponsorshipDetail.donorPhone}</p>
                            </div>
                            <div>
                              <p><strong>Mascota ID:</strong> {sponsorshipDetail.petId}</p>
                              <p><strong>Monto:</strong> S/ {sponsorshipDetail.amount}</p>
                              <p><strong>Estado:</strong> {sponsorshipDetail.status}</p>
                            </div>
                          </div>

                          <div className="stack-form">
                            <p><strong>Número de operación:</strong> {sponsorshipDetail.operationNumber}</p>
                            <p><strong>Nota de revisión:</strong> {sponsorshipDetail.reviewNote || 'Sin observaciones'}</p>
                            <p><strong>Revisado:</strong> {sponsorshipDetail.reviewedAt || 'Pendiente'}</p>
                            {sponsorshipDetail.receiptUrl ? (
                              <a className="whatsapp-link" href={sponsorshipDetail.receiptUrl} target="_blank" rel="noreferrer">
                                Ver comprobante
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="admin-section">
                  <div className="admin-section-header">
                    <h3>Adopciones</h3>
                  </div>

                  <p className="admin-section-description">
                    Este módulo permite revisar las solicitudes de adopción. Aquí se valida la información del postulante,
                    se revisan los datos de la vivienda y se decide si se aprueba o rechaza la solicitud.
                  </p>

                  <div className="admin-list">
                    {adminAdoptions.length === 0 ? (
                      <p className="admin-empty-state">No hay solicitudes de adopción registradas.</p>
                    ) : (
                      adminAdoptions.map((item) => (
                        <article key={item.id} className="admin-item">
                          <div className="admin-meta">
                            <div className="admin-meta-header">
                              <strong>{item.applicantName}</strong>
                              <span className="status-pill">{item.status}</span>
                            </div>
                            <p>{item.district}</p>
                            <p>Animal: {item.petId}</p>
                          </div>

                          <div className="admin-actions-row">
                            <button type="button" className="secondary-btn" onClick={() => loadAdoptionDetail(item.id)}>
                              Detalle
                            </button>
                            <button type="button" className="success-btn" onClick={() => handleAdoptionAdminReview(item.id, 'approve')}>
                              Aprobar
                            </button>
                            <button type="button" className="danger-btn" onClick={() => handleAdoptionAdminReview(item.id, 'reject')}>
                              Rechazar
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  {adminReviewMessage ? <p className="alert success">{adminReviewMessage}</p> : null}

                  {adoptionDetailModalOpen && adoptionDetail ? (
                    <div className="modal-overlay" onClick={() => setAdoptionDetailModalOpen(false)}>
                      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                          <div>
                            <p className="modal-eyebrow">Detalle</p>
                            <h3>Solicitud de adopción</h3>
                          </div>
                          <button
                            type="button"
                            className="modal-close"
                            aria-label="Cerrar detalle"
                            onClick={() => setAdoptionDetailModalOpen(false)}
                          >
                            ×
                          </button>
                        </div>

                        <div className="modal-body">
                          <div className="admin-detail-grid">
                            <div>
                              <p><strong>Solicitante:</strong> {adoptionDetail.applicantName}</p>
                              <p><strong>Teléfono:</strong> {adoptionDetail.applicantPhone}</p>
                              <p><strong>Distrito:</strong> {adoptionDetail.district}</p>
                            </div>
                            <div>
                              <p><strong>Mascota ID:</strong> {adoptionDetail.petId}</p>
                              <p><strong>Estado:</strong> {adoptionDetail.status}</p>
                              <p><strong>Vivienda:</strong> {adoptionDetail.homeType}</p>
                            </div>
                          </div>

                          <div className="stack-form">
                            <p><strong>Acuerdo familiar:</strong> {adoptionDetail.familyAgreement ? 'Sí' : 'No'}</p>
                            <p><strong>Estabilidad económica:</strong> {adoptionDetail.economicStability ? 'Sí' : 'No'}</p>
                            <p><strong>Compromiso de esterilización:</strong> {adoptionDetail.sterilizationCommitment ? 'Sí' : 'No'}</p>
                            <p><strong>Notas:</strong> {adoptionDetail.notes || 'Sin observaciones'}</p>
                            <p><strong>Revisión:</strong> {adoptionDetail.reviewNote || 'Sin observaciones'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Albergue Lima Norte</p>
            <h1>Catálogo y padrinazgo</h1>
          </div>

          <nav className="nav-bar" aria-label="Navegación principal">
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">
              Inicio
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/admin">
              Admin
            </NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={renderCatalogPage()} />
          <Route path="/apadrinar" element={renderSponsorPage()} />
          <Route path="/adopcion" element={renderAdoptionPage()} />
          <Route path="/admin" element={renderAdminPage()} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
