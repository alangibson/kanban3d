
//
// Default objects
//

export const TOPIC = {
  id: null,           // uuid as string
  name: null,         // string
  description: null,  // string
  who: null,          // string
  when: null,         // ISO8601 datetime as string
  where: null         // string
}

export const STAGE = {
  name: null,
  topics: []
}

export const PROJECT = {
  name: null,
  owner_id: null,
  version: 1,
  stages: [
    {
      name: "Soon",
      topics: []
    },
    {
      name: "In Progress",
      topics: []
    }
    ,
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
  ]
};

//
// Functions
//

export function clone (o) {
  return JSON.parse(JSON.stringify(o))
}
