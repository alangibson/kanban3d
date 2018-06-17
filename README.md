
export PATH="$PWD/node_modules/.bin:$PWD/node-v9.5.0-linux-x64/bin:$PATH"
npm install @vue/cli
vue create ichiban
npm install --save @firebase/app @firebase/auth @firebase/database
npm install --save vuetify
npm install --save vuedraggable
npm install --save lodash
npm install --save uuid
npm install --save luxon
npm install --save cuid
npm install --save froala-editor
npm install --save vue-froala-wysiwyg

# Run in dev mode
cd ichiban
export PATH="$PWD/node_modules/.bin:$PWD/node-v9.5.0-linux-x64/bin:$PATH"
npm install
npm run serve

# Initialize Firebase
cd ~/dev/kanban3d/ichiban
firebase login
firebase init

# Deploy to Firebase
export PATH="$PWD/node_modules/.bin:$PATH"
cd ~/dev/kanban3d/ichiban
export PATH="$PWD/node_modules/.bin:$PATH"
rm -fr dist
npm run build
firebase deploy
