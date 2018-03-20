
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

//
// Functions
//

export function clone (o) {
  return JSON.parse(JSON.stringify(o))
}
