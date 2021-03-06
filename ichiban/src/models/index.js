import uuid from 'uuid/v4';
import { clone, safeJSONStringify } from '@/common';
import moment from 'moment';
import momentDurationFormat from 'moment-duration-format';

// These objects get written directly into the Firestore 'stages' collection.
export function defaultStages () {
  let stages = new StagesMap();
  stages[uuid()] = new Stage("Soon");
  stages[uuid()] = new Stage("In Progress");
  stages[uuid()] = new Stage("Paused");
  stages[uuid()] = new Stage("Done");
  stages[uuid()] = new Stage("Someday");
  stages[uuid()] = new Stage("Handed Off");
  stages[uuid()] = new Stage("Blocked");
  stages[uuid()] = new Stage("Canceled");
  return stages;
}

function nullIfUndefined (o) {
  if (o === undefined) {
    return null;
  } else {
    return o;
  }
}

//
// Project
//

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
  toFirestoreDoc (db) {
    return {
      name: this.name,
      owner_id: this.owner_id,
      version: this.version,
      stages: this.stages
        .map(stageRef => db.doc(stageRef.path))
    };
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

  get length () {
    return Object.keys(this).length;
  }

  get isEmpty () {
    return ! Object.keys(this).length;
  }
}

//
// Stages
///

export class Stage {
  constructor (name, ref, topics) {
    this.name = name;
    this.ref = ref;
    if (! topics) {
      this.topics = [];
    } else {
      this.topics = topics;
    }
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
  toFirestoreDoc (db) {
    return {
      name: this.name,
      topics: this.topics
        .map(topicRef => db.doc(topicRef.path))
    };
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
  toFirestoreDoc (db) {
    return clone(this);
  }
}

/**
 * Map of Stages, where key is Stage id from Firestore and value is Stage object.
 */
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

  forEach (cb) {
    Object.keys(this)
      .forEach(key => {
        cb(this[key]);
      });
  }
}

//
// Topics
//

export class Topic {
  // constructor ({name, description, who, when, where, createdAt, tags}) {
  constructor (name, description, who, when, where, createdAt, tags, metrics) {
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
    if (!metrics) {
      this.metrics = new TopicMetrics();
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
    let topic = new Topic(
      topicSnapshot.data().name,
      topicSnapshot.data().description,
      topicSnapshot.data().who,
      topicSnapshot.data().when,
      topicSnapshot.data().where,
      topicSnapshot.data().createdAt,
      topicSnapshot.data().tags
    );
    // TODO dont use id here
    topic.id = topicSnapshot.id;
    topic.ref = new TopicRef(topicSnapshot.ref.id, topicSnapshot.ref.path);
    // HACK backwards compatability
    if (topicSnapshot.data().metrics) {
      topic.metrics = new TopicMetrics(
        topicSnapshot.data().metrics.lastStageRef,
        topicSnapshot.data().metrics.lastTimestamp,
        topicSnapshot.data().metrics.msInStage
      );
    }
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
  toFirestoreDoc (db) {
    let doc = {
      name: this.name,
      description: this.description,
      who: this.who,
      when: this.when,
      where: this.where,
      createdAt: this.createdAt,
      tags: this.tags
    };
    // TODO why do we only sometimes have this?
    // TODO should this actually be included?
    if (this.ref) {
      // doc.ref = this.ref.toFirestoreDoc(db);
      doc.ref = db.doc(this.ref.path);
    }
    if (this.metrics) {
      doc.metrics = this.metrics.toFirestoreDoc(db);
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
  toFirestoreDoc (db) {
    return clone(this);
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

export class TopicMetrics {
  /**
   * TODO should not use a Firestore ref object here.
   * Instead, use StageRef and convert to Firestore ref on flush to Firestore.
   *
   * @param lastStageRef A real Firestore ref object
   * @param lastTimestamp A Date object
   * @param msInStage
   */
  constructor (lastStageRef, lastTimestamp, msInStage) {
    // Make sure we never store a Firestore ref object
    if (lastStageRef) {
      this.lastStageRef = new StageRef(lastStageRef.id, lastStageRef.path);
    } else {
      this.lastStageRef = null;
    }
    this.lastTimestamp = lastTimestamp;
    if (msInStage) {
      this.msInStage = msInStage;
    } else {
      this.msInStage = {};
    }
  }

  create (stageRef) {
    // Make sure we never store a Firestore ref object
    let ref = new StageRef(stageRef.id, stageRef.path);
    this.msInStage[ref.id] = 0;
    this.lastStageRef = ref;
    this.lastTimestamp = Date.now();
  }

  move (toStageRef) {
    // Make sure we never store a Firestore ref object
    let ref = new StageRef(toStageRef.id, toStageRef.path);
    let now = Date.now();
    if (this.lastStageRef && this.lastStageRef.id === ref.id) {
      this.msInStage[ref.id] += (now - this.lastTimestamp);
    } else {
      if (this.msInStage[ref.id] != null) {
        this.msInStage[ref.id] += (now - this.lastTimestamp);
      } else {
        // We've probably 'move'd without first doing 'create'
        this.msInStage[ref.id] = 0;
      }
    }
    this.lastStageRef = ref;
    this.lastTimestamp = now;
  }

  /**
   * Compute and return history metrics
   */
  get history () {
    // Add in additional interval for this.lastStageRef because we must still be in that stage
    // HACK backwards compatibility
    let history = clone(this.msInStage);
    if (this.lastStageRef) {
      history[this.lastStageRef.id] += (Date.now() - this.lastTimestamp);
    }
    return history;
  }

  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc (db) {
    return {
      lastStageRef: db.doc(this.lastStageRef.path),
      lastTimestamp: this.lastTimestamp,
      msInStage: this.msInStage
    };
  }
}

//
// Events
//

export class Event {
  constructor (type, topic, stage, createdAt) {
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
  toFirestoreDoc (db) {
    return {
      type: this.type,
      topic: this.topic,
      stage: this.stage,
      createdAt: this.createdAt
    };
  }

  static fromSnapshot (eventSnapshot) {
    let event = new Event();
    Object.assign(event, eventSnapshot.data());
    event.ref = new EventRef(eventSnapshot.ref.id, eventSnapshot.ref.path);
    return event;
  }
}

export class EventRef {
  constructor (id, path) {
    this.id = id;
    this.path = path;
  }

  /**
   * Plain object suitable for saving to Firestore.
   */
  toFirestoreDoc (db) {
    return clone(this);
  }
}

//
// export EventTypes {
//   TOPIC_CREATED: 'TOPIC_CREATED',
//   TOPIC_CREATED: 'TOPIC_CREATED'
// }

export class EventsCollection extends Array {
  constructor(...args) {
    super(...args);
  }

  static fromSnapshot (eventsSnapshot) {
    let events = new EventsCollection();
    eventsSnapshot.forEach(eventSnapshot => {
      events.push(Event.fromSnapshot(eventSnapshot));
    });
    return events;
  }

}