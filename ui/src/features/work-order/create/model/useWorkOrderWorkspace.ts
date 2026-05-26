import { useEffect, useState } from 'react'
import { getCampaigns } from '../../../../entities/campaign/api/getCampaigns'
import type { Campaign } from '../../../../entities/campaign/model/campaign.types'
import { getCustomers } from '../../../../entities/customer/api/getCustomers'
import type { Customer } from '../../../../entities/customer/model/customer.types'
import { getLaborsByProject } from '../../../../entities/labor/api/getLaborsByProject'
import type { Labor } from '../../../../entities/labor/model/labor.types'
import { getProjectById } from '../../../../entities/project/api/getProjectById'
import { getProjects } from '../../../../entities/project/api/getProjects'
import type { Project, ProjectDetail } from '../../../../entities/project/model/project.types'

type UseWorkOrderWorkspaceParams = {
  onCustomerChange?: () => void
  onProjectChange?: () => void
  initialCustomerId?: number | ''
  initialProjectId?: number | ''
}


export function useWorkOrderWorkspace({
  onCustomerChange,
  onProjectChange,
  initialCustomerId,
  initialProjectId,
}: UseWorkOrderWorkspaceParams = {}) {

  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [customersError, setCustomersError] = useState<string | null>(null)

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(
  initialCustomerId ?? '',
)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
  initialProjectId ?? '',
)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)

  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectDetail | null>(null)
  const [isLoadingProjectDetail, setIsLoadingProjectDetail] = useState(false)
  const [projectDetailError, setProjectDetailError] = useState<string | null>(null)

  const [labors, setLabors] = useState<Labor[]>([])
  const [isLoadingLabors, setIsLoadingLabors] = useState(false)
  const [laborsError, setLaborsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCustomers() {
      setIsLoadingCustomers(true)
      setCustomersError(null)

      try {
        const data = await getCustomers({
          page: 1,
          perPage: 100,
        })
        if (cancelled) return
        setCustomers(data)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Error cargando clientes'
        setCustomers([])
        setCustomersError(message)
      } finally {
        if (!cancelled) {
          setIsLoadingCustomers(false)
        }
      }
    }

    void loadCustomers()

    return () => {
      cancelled = true
    }
  }, [workspaceVersion])


  useEffect(() => {
    if (selectedCustomerId === '') return
    const customerId = selectedCustomerId
    let cancelled = false

    async function loadProjects() {
      setIsLoadingProjects(true)
      setProjectsError(null)

      try {
        const data = await getProjects({
          customerId,
          page: 1,
          perPage: 100,
        })
        if (cancelled || selectedCustomerId !== customerId) return
        setProjects(data)
      } catch (error) {
        if (cancelled || selectedCustomerId !== customerId) return
        const message = error instanceof Error ? error.message : 'Error cargando proyectos'
        setProjects([])
        setProjectsError(message)
      } finally {
        if (!cancelled && selectedCustomerId === customerId) {
          setIsLoadingProjects(false)
        }
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [selectedCustomerId])


  useEffect(() => {
    if (selectedCustomerId === '' || !selectedProject) return
    const customerId = selectedCustomerId
    const projectName = selectedProject.name
    let cancelled = false

    async function loadCampaigns() {
      setIsLoadingCampaigns(true)
      setCampaignsError(null)

      try {
        const data = await getCampaigns({
          customerId,
          projectName,
        })
        if (cancelled || selectedCustomerId !== customerId || selectedProject?.name !== projectName) {
          return
        }
        setCampaigns(data)
      } catch (error) {
        if (cancelled || selectedCustomerId !== customerId || selectedProject?.name !== projectName) {
          return
        }
        const message = error instanceof Error ? error.message : 'Error cargando campañas'
        setCampaigns([])
        setCampaignsError(message)
      } finally {
        if (!cancelled && selectedCustomerId === customerId && selectedProject?.name === projectName) {
          setIsLoadingCampaigns(false)
        }
      }
    }

    void loadCampaigns()

    return () => {
      cancelled = true
    }
  }, [selectedCustomerId, selectedProject])


  useEffect(() => {
    if (selectedProjectId === '') return
    const projectId = selectedProjectId
    let cancelled = false

    async function loadProjectDetail() {
      setIsLoadingProjectDetail(true)
      setProjectDetailError(null)

      try {
        const data = await getProjectById({
          projectId,
        })
        if (cancelled || selectedProjectId !== projectId) return
        setSelectedProjectDetail(data)
      } catch (error) {
        if (cancelled || selectedProjectId !== projectId) return
        const message =
          error instanceof Error ? error.message : 'Error cargando detalle del proyecto'
        setSelectedProjectDetail(null)
        setProjectDetailError(message)
      } finally {
        if (!cancelled && selectedProjectId === projectId) {
          setIsLoadingProjectDetail(false)
        }
      }
    }

    void loadProjectDetail()

    return () => {
      cancelled = true
    }
  }, [selectedProjectId])


  useEffect(() => {
    if (selectedProjectId === '') return
    const projectId = selectedProjectId
    let cancelled = false

    async function loadLabors() {
      setIsLoadingLabors(true)
      setLaborsError(null)

      try {
        const data = await getLaborsByProject({
          projectId,
        })
        if (cancelled || selectedProjectId !== projectId) return
        setLabors(data)
      } catch (error) {
        if (cancelled || selectedProjectId !== projectId) return
        const message = error instanceof Error ? error.message : 'Error cargando labores'
        setLabors([])
        setLaborsError(message)
      } finally {
        if (!cancelled && selectedProjectId === projectId) {
          setIsLoadingLabors(false)
        }
      }
    }

    void loadLabors()

    return () => {
      cancelled = true
    }
  }, [selectedProjectId])


  function resetProjectDependents() {
    setProjects([])
    setProjectsError(null)
    setSelectedProjectId('')
    setSelectedProject(null)
    setCampaigns([])
    setCampaignsError(null)
    setSelectedProjectDetail(null)
    setProjectDetailError(null)
    setLabors([])
    setLaborsError(null)
  }

  function resetSelectionDependents() {
    setCampaigns([])
    setCampaignsError(null)
    setSelectedProjectDetail(null)
    setProjectDetailError(null)
    setLabors([])
    setLaborsError(null)
  }

  function handleCustomerChange(value: string) {
    setSelectedCustomerId(value ? Number(value) : '')
    resetProjectDependents()
    onCustomerChange?.()
  }

  function handleProjectChange(value: string) {
    const projectId = value ? Number(value) : ''
    const project = projects.find((item) => item.id === Number(value)) ?? null

    setSelectedProjectId(projectId)
    setSelectedProject(project)
    resetSelectionDependents()
    onProjectChange?.()
  }

  function resetWorkspaceSelection() {
    setSelectedCustomerId('')
    setProjects([])
    setProjectsError(null)
    setSelectedProjectId('')
    setSelectedProject(null)
    setCampaigns([])
    setCampaignsError(null)
    setSelectedProjectDetail(null)
    setProjectDetailError(null)
    setLabors([])
    setLaborsError(null)
  }

  useEffect(() => {
    function handleTenantChanged() {
      setCustomers([])
      setCustomersError(null)
      resetWorkspaceSelection()
      setWorkspaceVersion((current) => current + 1)
    }

    window.addEventListener('ponti:tenant-changed', handleTenantChanged)

    return () => {
      window.removeEventListener('ponti:tenant-changed', handleTenantChanged)
    }
  }, [])

  return {
    customers,
    isLoadingCustomers,
    customersError,
    selectedCustomerId,
    handleCustomerChange,
    projects,
    isLoadingProjects,
    projectsError,
    selectedProjectId,
    selectedProject,
    handleProjectChange,
    campaigns,
    isLoadingCampaigns,
    campaignsError,
    selectedProjectDetail,
    isLoadingProjectDetail,
    projectDetailError,
    labors,
    isLoadingLabors,
    laborsError,
    resetWorkspaceSelection,
  }

}
