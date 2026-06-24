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
          echo '🔄 STAGE 1: Checkout du code'
        }
        checkout scm
        script {
          echo '✅ Code récupéré'
        }
      }
    }

    stage('Install') {
      steps {
        script {
          echo '📦 STAGE 2: Installation des dépendances'
        }
        sh 'node --version'
        sh 'npm --version'
        sh 'npm install'
        script {
          echo '✅ Dépendances installées'
        }
      }
    }

    stage('Unit Tests') {
      steps {
        script {
          echo '🧪 STAGE 3: Tests unitaires'
        }
        sh 'npm test -- --testPathPattern="spec.ts$" --passWithNoTests'
        script {
          echo '✅ Tests unitaires réussis'
        }
      }
    }

    stage('Integration Tests') {
      steps {
        script {
          echo '🔗 STAGE 4: Tests d\'intégration'
        }
        sh 'npm test -- --testPathPattern="integration" --passWithNoTests'
        script {
          echo '✅ Tests d\'intégration réussis'
        }
      }
    }

    stage('Build') {
      steps {
        script {
          echo '🔨 STAGE 5: Build du projet'
        }
        sh 'npm run build'
        script {
          echo '✅ Build réussi'
        }
      }
    }

    stage('Archive') {
      steps {
        script {
          echo '📦 STAGE 6: Archivage'
        }
        archiveArtifacts(
          artifacts: 'dist/**/*',
          allowEmptyArchive: true
        )
        script {
          echo '✅ Artifacts archivés'
        }
      }
    }
  }

  post {
    always {
      script {
        echo '📊 Pipeline terminé'
      }
      cleanWs()
    }
    
    success {
      script {
        echo '🎉 PIPELINE RÉUSSI!'
      }
    }
    
    failure {
      script {
        echo '❌ PIPELINE ÉCHOUÉ'
      }
    }
  }
}