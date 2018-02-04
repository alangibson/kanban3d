
export PATH="$PWD/node_modules/.bin:$PWD/node-v9.5.0-linux-x64/bin:$PATH"

npm install @vue/cli
vue create kanban3d

npm install --save @firebase/app @firebase/auth @firebase/database
npm install --save vuetify
<!-- npm install --save vuexfire -->
npm install --save vuedraggable
npm install --save lodash

cd kanban3d
npm run serve

cd kanban3d
firebase login
cd kanban3d
firebase init
