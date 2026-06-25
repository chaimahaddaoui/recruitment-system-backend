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
    DATABASE_URL = 'postgresql://postgres:postgres@postgres:5432/recruitment_test'
  }

  triggers {
    pollSCM('H/5 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        script {
          echo 'STAGE 1: Checkout du code'
        }
        checkout scm
        script {
          echo 'OK: Code recupere'
        }
      }
    }

    stage('Install') {
      steps {
        script {
          echo 'STAGE 2: Installation des dependances'
        }
        sh '''
          npm install
        '''
        script {
          echo 'OK: Dependances installees'
        }
      }
    }

    stage('Prisma Migration') {
      steps {
        script {
          echo 'STAGE 2.5: Migration des tables Prisma'
        }
        sh '''
          npx prisma migrate deploy
        '''
        script {
          echo 'OK: Tables creees'
        }
      }
    }

    stage('Unit Tests') {
      steps {
        script {
          echo 'STAGE 3: Tests unitaires'
        }
        sh '''
          npm test -- --testPathPattern="spec.ts$" --passWithNoTests
        '''
        script {
          echo 'OK: Tests unitaires reussis'
        }
      }
    }

    stage('Integration Tests') {
      steps {
        script {
          echo 'STAGE 4: Tests d\'integration'
        }
        sh '''
          npm test -- --testPathPattern="integration" --passWithNoTests
        '''
        script {
          echo 'OK: Tests d\'integration reussis'
        }
      }
    }

    stage('Build') {
      steps {
        script {
          echo 'STAGE 5: Build du projet'
        }
        sh '''
          npm run build
        '''
        script {
          echo 'OK: Build reussi'
        }
      }
    }

    stage('Archive') {
      steps {
        script {
          echo 'STAGE 6: Archivage'
        }
        archiveArtifacts(
          artifacts: 'dist/**/*',
          allowEmptyArchive: true
        )
        script {
          echo 'OK: Artifacts archives'
        }
      }
    }
  }

  post {
    always {
      script {
        echo 'Pipeline termine'
      }
      cleanWs()
    }
    
    success {
      script {
        echo 'SUCCESS: Pipeline reussi!'
      }
    }
    
    failure {
      script {
        echo 'FAILURE: Pipeline echoue'
      }
    }
  }
}
