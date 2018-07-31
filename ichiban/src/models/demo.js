import uuid from 'uuid/v4';
import { ProjectsMap, StagesMap, TopicsMap, Project, Stage, Topic, StageRef, TopicRef } from '@/models';

export default function () {
  let projects = new ProjectsMap();
  let topics = new TopicsMap();
  let stages = new StagesMap();
  let stageRefs = [];
  let stageKeys = [
    ['soon', 'Soon', 'Upcoming topics that need your attention'],
    ['in progress', 'In Progress', 'Topics you\'re actively working on'],
    ['paused', 'Paused', 'Topics that you\'re taking a break from'],
    ['done', 'Done', 'Finished topics'],
    ['someday', 'Someday', 'Low value topics you might do someday'],
    ['handed off', 'Handed Off', 'Topics you\'ve delegated to someone else'],
    ['blocked', 'Blocked', 'Topics you can\'t work on right now due to external forces'],
    ['cancelled', 'Cancelled', 'Topics you never needed in the first place']
  ];
  // Note: Do not change projectId. Is used in check when setting new active project after login.
  // FIXME use uuid for project id
  let projectId = 'demo-project';
  let project = new Project();
  stageKeys.forEach(keyName => {
    // TODO use real constructor
    let stage = new Stage();
    stage.name = keyName[1];
    stage.ref = new StageRef(keyName[0], keyName[0]);
    stages[keyName[0]] = stage;
    let stageRef = new StageRef(keyName[0], null);
    stageRefs.push(stageRef);
    project.stages.push(stageRef);
    let topicId = uuid();
    topics[topicId] = new Topic();
    topics[topicId]._name = keyName[2];
    stages[keyName[0]].topics.push(new TopicRef(topicId, null));
  });
  projects[projectId] = project;
  return { projects, project, topics, stages, activeProjectId: projectId };
}

