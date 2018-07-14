import { clone, safeJSONStringify } from '@/common';
import moment from 'moment';
import momentDurationFormat from 'moment-duration-format';

// These objects get written directly into the Firestore 'stages' collection.
export const DEFAULT_STAGES = [
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

export class Project {
  constructor () {
    this.name = null;
    this.owner_id = null;
    this.version = 1;
    // Note: This is not what we get from Firestore. All stages are Firestore refs.
    this.stages = [];
  }
  
  static fromSnapshot (projectSnapshot) {
    let project = new Project();
    Object.assign(project, projectSnapshot.data());
    project.id = projectSnapshot.id;
    project.ref = new StageRef(projectSnapshot.ref.id, projectSnapshot.ref.path);
    project.stages = projectSnapshot
      .data()
      .stages
      .map(stageRef => new StageRef(stageRef.id, stageRef.path));
    return project;
  }
  
  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc () {
    return clone(this);
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
    stage.ref = new StageRef(stageSnapshot.ref.id, stageSnapshot.ref.path);
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

export class StageRef {
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

function nullIfUndefined (o) {
  if (o === undefined) {
    return null;
  } else {
    return o;
  }
}

export class Topic {
  // constructor ({name, description, who, when, where, createdAt, tags}) {
  constructor (name, description, who, when, where, createdAt, tags) {
    this.id = null;           // uuid as string
    this._name = nullIfUndefined(name);         // string
    this.description = nullIfUndefined(description);  // string
    this.who = nullIfUndefined(who);          // string
    this.when = nullIfUndefined(when);         // ISO8601 datetime as string
    this.where = nullIfUndefined(where);        // string
    this.tags = nullIfUndefined(tags);           // array of string
    if (!tags) {
      this.tags = [];
    }
    this.createdAt = nullIfUndefined(createdAt);
    if (!createdAt) {
      this.createdAt = new Date();
    }
    // Timer
    this.interval = null;
    this.countdown = null;
    this.startTimer();
  }

  clearTimer () {
    clearInterval(this.interval);
  }

  startTimer () {
    if (! this.when)
      return;
    this.interval = setInterval(() => {
      let msLeft = Date.parse(this.when) - new Date().getTime();
      if (msLeft <= 0) {
        this.countdown = '00:00';
        this.clearTimer();
      } else {
        this.countdown = moment.duration(msLeft / 1000, 'seconds').format();
      }
    }, 1000);
  }

  get name () {
    return this._name;
  }

  /**
   * Name with tags stripped out.
   */
  get sanitizedName () {
    return this._name.replace(/#\w*/gi, '');
  }

  set name (name) {
    this._name = name;
    this.tags = name.match(/#(\w*)/gi);
  }

  static fromSnapshot (topicSnapshot) {
    // let topic = new Topic({
    //   name: topicSnapshot.data().name,
    //   description: topicSnapshot.data().description,
    //   who: topicSnapshot.data().who,
    //   when: topicSnapshot.data().when,
    //   where: topicSnapshot.data().where,
    //   createdAt: topicSnapshot.data().createdAt,
    //   tags: topicSnapshot.data().tags
    // });

    let topic = new Topic(
      topicSnapshot.data().name,
      topicSnapshot.data().description,
      topicSnapshot.data().who,
      topicSnapshot.data().when,
      topicSnapshot.data().where,
      topicSnapshot.data().createdAt,
      topicSnapshot.data().tags
    );

    // let topic = new Topic(topicSnapshot.data());

    // topic.name = topicSnapshot.data().name;
    // topic.description = topicSnapshot.data().description;
    // topic.who = topicSnapshot.data().who;
    // topic.when = topicSnapshot.data().when;
    // topic.where = topicSnapshot.data().where;

    // TODO dont use id here
    topic.id = topicSnapshot.id;
    topic.ref = new TopicRef(topicSnapshot.ref.id, topicSnapshot.ref.path);

    // HACK backwards compatability
    if (topicSnapshot.data().createdAt) {
      topic.createdAt = topicSnapshot.data().createdAt;
    }
    // HACK backwards compatability
    if (topicSnapshot.data().descripition) {
      topic.description = topicSnapshot.data().descripition;
    }
    // HACK backwards compatability
    if (topicSnapshot.data().tags) {
      topic.tags = topicSnapshot.data().tags;
    }
    return topic;
  }
  
  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc () {
    let doc = {
      name: this.name,
      description: this.description,
      who: this.who,
      when: this.when,
      where: this.where,
      createdAt: this.createdAt,
      tags: this.tags
      // TODO id should not be included
      // id: this.id
    };
    // TODO why do we only sometimes have this?
    // TODO should this actually be included?
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
  
  getDefaultProject () {
    return this[Object.keys(this)[0]];
  }

  getDefaultProjectId () {
    return Object.keys(this)[0];
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

  get length () {
    return Object.keys(this).length;
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