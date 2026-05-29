export const GET_PROJECTS = `
  query GetProjects($search: String, $skip: Int, $take: Int, $sortField: String, $sortOrder: String) {
    projects(search: $search, skip: $skip, take: $take, sortField: $sortField, sortOrder: $sortOrder) {
      items {
        _id
        name
        description
        updatedAt
      }
      total
      skip
      take
    }
  }
`;

export const GET_PROJECT = `
  query GetProject($id: ID!) {
    project(id: $id) {
      _id
      name
      description
      updatedAt
      taskCount
    }
  }
`;

export const CREATE_PROJECT = `
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description) {
      _id
      name
      description
    }
  }
`;

export const UPDATE_PROJECT = `
  mutation UpdateProject($id: ID!, $name: String, $description: String) {
    updateProject(id: $id, name: $name, description: $description) {
      _id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_PROJECT = `
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      deletedProject
      deletedTasks
    }
  }
`;

export const GET_TASKS = `
  query GetTasks(
    $projectId: ID
    $status: String
    $priority: String
    $search: String
    $skip: Int
    $take: Int
    $sortField: String
    $sortOrder: String
  ) {
    tasks(
      projectId: $projectId
      status: $status
      priority: $priority
      search: $search
      skip: $skip
      take: $take
      sortField: $sortField
      sortOrder: $sortOrder
    ) {
      items {
        _id
        projectId
        title
        description
        status
        priority
        dueDate
        updatedAt
      }
      total
      skip
      take
    }
  }
`;

export const GET_TASK = `
  query GetTask($id: ID!) {
    task(id: $id) {
      _id
      projectId
      title
      description
      status
      priority
      dueDate
    }
  }
`;

export const CREATE_TASK = `
  mutation CreateTask(
    $projectId: ID!
    $title: String!
    $description: String
    $status: String
    $priority: String
    $dueDate: String
  ) {
    createTask(
      projectId: $projectId
      title: $title
      description: $description
      status: $status
      priority: $priority
      dueDate: $dueDate
    ) {
      _id
      title
    }
  }
`;

export const UPDATE_TASK = `
  mutation UpdateTask(
    $id: ID!
    $projectId: ID
    $title: String
    $description: String
    $status: String
    $priority: String
    $dueDate: String
  ) {
    updateTask(
      id: $id
      projectId: $projectId
      title: $title
      description: $description
      status: $status
      priority: $priority
      dueDate: $dueDate
    ) {
      _id
      title
    }
  }
`;

export const DELETE_TASK = `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;
