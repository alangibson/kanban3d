import { clone, safeJSONStringify } from '@/common';

export class Project {
  constructor () {
    this.name = null;
    this.owner_id = null;
    this.version = 1;
    this.stages = [
      {
        name: "Soon",
        topics: []
      },
      {
        name: "In Progress",
        topics: []
      },
      {
        name: "Paused",
        topics: []
      },
      {
        name: "Done",
        topics: []
      },
      {
        name: "Someday",
        topics: []
      },
      {
        name: "Handed Off",
        topics: []
      },
      {
        name: "Blocked",
        topics: []
      },
      {
        name: "Canceled",
        topics: []
      }
    ];
  }
  
  static fromSnapshot (projectSnapshot) {
    let project = new Project();
    Object.assign(project, projectSnapshot.data());
    project.id = projectSnapshot.id;
    return project;
  }
}

export class Stage {
  constructor () {
    this.name = null;
    this.topics = [];
  }
  
  static fromSnapshot (stageSnapshot) {
    let stage = new Stage();
    stage.id = stageSnapshot.id;
    stage.name = stageSnapshot.data().name;
    stage.topics = stageSnapshot
      .data()
      .topics
      .map(topicRef => new TopicRef(topicRef.id, topicRef.path));
    return stage;
  }
  
  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc () {
    return clone(this);
  }
}

export class Topic {
  constructor () {
    this.id = null;           // uuid as string
    this.name = null;         // string
    this.description = null;  // string
    this.who = null;          // string
    this.when = null;         // ISO8601 datetime as string
    this.where = null;        // string
  }
  
  static fromSnapshot (topicSnapshot) {
    let topic = new Topic();
    topic.name = topicSnapshot.data().name;
    topic.description = topicSnapshot.data().description;
    topic.who = topicSnapshot.data().who;
    topic.when = topicSnapshot.data().when;
    topic.where = topicSnapshot.data().where;
    topic.id = topicSnapshot.id;
    topic.ref = new TopicRef(topicSnapshot.ref.id, topicSnapshot.ref.path);
    return topic;
  }
  
  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc () {
    let doc = {
      name: this.name,
      descripition: this.description,
      who: this.who,
      when: this.when,
      where: this.where,
      id: this.id
    };
    // TODO why do we only sometimes have this?
    if (this.ref) {
      doc.ref = this.ref.toFirestoreDoc();
    }
    return doc;
  }
}

export class TopicRef {
  constructor (id, path) {
    this.id = id;
    this.path = path;
  }
  
  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc () {
    return clone(this);
  }
}

export class Event {
  constructor ({type, topic, stage, createdAt}) {
    this.type = type;
    this.topic = topic;
    this.stage = stage;
    if (createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date();
    }
  }
  
  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc () {
    return clone(this);
  }
}

export class ProjectsMap {
  static fromSnapshot (projectsSnapshot) {
    let projects = new ProjectsMap();
    projectsSnapshot.forEach(projectSnapshot => {
      projects[projectSnapshot.id] = Project.fromSnapshot(projectSnapshot);
    });
    return projects;
  }
  
  hasProject (projectId) {
    return projectId in this;
  }
}

export class StagesMap {
  static fromSnapshot (stagesSnapshot) {
    let stages = new StagesMap();
    stagesSnapshot.forEach(stageSnapshot => {
      stages[stageSnapshot.id] = Stage.fromSnapshot(stageSnapshot);
    });
    return stages;
  }
}

export class TopicsMap {
  static fromSnapshot (topicsSnapshot) {
    let topics = new TopicsMap();
    topicsSnapshot.forEach(topicSnapshot => {
      let topic = Topic.fromSnapshot(topicSnapshot);
      // TODO What is this doing? Can it go in Topic?
      // topic.ref = { path: topicSnapshot.ref.path };
      topics[topicSnapshot.id] = topic;
    });
    return topics;
  }
  
  hasTopic (topicId) {
    return topicId in this;
  }
}

export class EventsCollection extends Array {
  constructor(...args) {
    super(...args);
  }
}