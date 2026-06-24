
@'
// ════════════════════════════════════════════════════
// JENKINS PIPELINE - RECRUITMENT SYSTEM
// ════════════════════════════════════════════════════

pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
  }

  triggers {
    pollSCM('H/5 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        script {
          echo '════════════════════════════════════════'
          echo '🔄 STAGE 1: Checkout du code'
          echo '════════════════════════════════════════'
        }
        checkout scm
        script {
          echo '✅ Code récupéré avec succès'
        }
      }
    }

    stage('Install Dependencies') {
      steps {
        script {
          echo '════════════════════════════════════════'
          echo '📦 STAGE 2: Installation des dépendances'
          echo '════════════════════════════════════════'
        }
        sh '''
          node --version
          npm --version
          npm install
        '''
        script {
          echo '✅ Dépendances installées'
        }
      }
    }

    stage('Unit Tests') {
      steps {
        script {
          echo '════════════════════════════════════════'
          echo '🧪 STAGE 3: Tests unitaires'
          echo '════════════════════════════════════════'
        }
        sh '''
          npm test -- --testPathPattern="spec.ts$" --passWithNoTests
        '''
        script {
          echo '✅ Tests unitaires réussis'
        }
      }
    }

    stage('Integration Tests') {
      steps {
        script {
          echo '════════════════════════════════════════'
          echo '🔗 STAGE 4: Tests d\'intégration'
          echo '════════════════════════════════════════'
        }
        sh '''
          npm test -- --testPathPattern="integration" --passWithNoTests
        '''
        script {
          echo '✅ Tests d\'intégration réussis'
        }
      }
    }

    stage('Build') {
      steps {
        script {
          echo '════════════════════════════════════════'
          echo '🔨 STAGE 5: Build du projet'
          echo '════════════════════════════════════════'
        }
        sh '''
          npm run build
        '''
        script {
          echo '✅ Build réussi'
        }
      }
    }

    stage('Archive Artifacts') {
      steps {
        script {
          echo '════════════════════════════════════════'
          echo '📦 STAGE 6: Archivage des artefacts'
          echo '════════════════════════════════════════'
        }
        sh '''
          tar -czf build.tar.gz dist/ || true
        '''
        archiveArtifacts(
          artifacts: 'build.tar.gz,dist/**/*',
          allowEmptyArchive: true
        )
        script {
          echo '✅ Artefacts archivés'
        }
      }
    }
  }

  post {
    always {
      script {
        echo '════════════════════════════════════════'
        echo '📊 RÉSUMÉ DU PIPELINE'
        echo '════════════════════════════════════════'
        echo "Build Status: ${currentBuild.result}"
        echo "Build Number: ${BUILD_NUMBER}"
      }
      cleanWs()
    }
    
    success {
      script {
        echo '🎉 PIPELINE RÉUSSI!'
        echo '✅ Tous les tests passent'
        echo '✅ Build réussi'
      }
    }
    
    failure {
      script {
        echo '❌ PIPELINE ÉCHOUÉ!'
      }
    }
  }
}
'@ | Out-File -Encoding UTF8 Jenkinsfile