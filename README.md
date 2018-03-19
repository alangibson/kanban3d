
export PATH="$PWD/node_modules/.bin:$PWD/node-v9.5.0-linux-x64/bin:$PATH"

npm install @vue/cli
vue create kanban3d

npm install --save @firebase/app @firebase/auth @firebase/database
npm install --save vuetify
npm install --save vuedraggable
npm install --save lodash
npm install --save uuid
npm install --save luxon
npm install --save cuid

cd kanban3d
npm run serve

cd ~/dev/kanban3d/kanban3d
firebase login
firebase init

cd ~/dev/kanban3d/kanban3d
rm -fr dist
npm run build
firebase deploy

