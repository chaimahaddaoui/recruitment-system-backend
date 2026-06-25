pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
  }

  environment {
    JWT_SECRET = 'test-secret-key-for-jenkins-build-recruitment-system'
    NODE_ENV = 'test'

    // Jenkins est dans Docker -> utiliser le nom du service postgres
    DATABASE_URL = 'postgresql://postgres:postgres@postgres:5432/recruitment_test'
  }

  triggers {
    pollSCM('H/5 * * * *')
  }

  stages {

    stage('Checkout') {
      steps {
        echo '========== STAGE 1 : Checkout =========='
        checkout scm
      }
    }

    stage('Install') {
      steps {
        echo '========== STAGE 2 : Installation =========='

        sh '''
          npm install
        '''
      }
    }

    stage('Prisma Generate & Migration') {
      steps {

        echo '========== STAGE 3 : Prisma =========='

        sh '''
          npx prisma generate
          npx prisma migrate deploy
        '''
      }
    }

    stage('Unit Tests') {

      steps {

        echo '========== STAGE 4 : Unit Tests =========='

        sh '''
          npm test -- --testPathIgnorePatterns=integration --passWithNoTests
        '''
      }

    }

    /*
    =================================================================
    Réactiver cette étape plus tard lorsque la base de test sera prête
    =================================================================

    stage('Integration Tests') {

      steps {

        echo '========== STAGE 5 : Integration Tests =========='

        sh '''
          npm test -- --testPathPattern="integration" --passWithNoTests
        '''

      }

    }

    */

    stage('Build') {

      steps {

        echo '========== STAGE 5 : Build =========='

        sh '''
          npm run build
        '''

      }

    }

    stage('Archive') {

      steps {

        echo '========== STAGE 6 : Archive =========='

        archiveArtifacts(
          artifacts: 'dist/**/*',
          allowEmptyArchive: true
        )

      }

    }

  }

  post {

    success {
      echo 'Pipeline terminé avec succès.'
    }

    failure {
      echo 'Pipeline échoué.'
    }

    always {
      cleanWs()
    }

  }

}