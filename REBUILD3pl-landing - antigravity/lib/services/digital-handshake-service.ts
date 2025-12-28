import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Types for Digital Handshake system
export interface DigitalHandshakeRequest {
  shipmentId: string
  deliveryPersonId: string
  recipientId?: string
  deliveryLocation: {
    latitude: number
    longitude: number
    address: string
    timestamp: Date
  }
  nfcData: NFCHandshakeData
  biometricData?: BiometricData
  additionalVerification?: AdditionalVerification
}

export interface NFCHandshakeData {
  deviceId: string
  tagId: string
  encryptedPayload: string
  signature: string
  timestamp: Date
  deviceCapabilities: string[]
}

export interface BiometricData {
  type: 'fingerprint' | 'face' | 'voice' | 'signature'
  data: string // Base64 encoded biometric data
  confidence: number // 0-100 confidence score
  timestamp: Date
}

export interface AdditionalVerification {
  photoProof?: string // Base64 encoded photo
  customerSignature?: string // Base64 encoded signature
  otp?: string // One-time password
  securityQuestions?: Array<{
    question: string
    answer: string
  }>
}

export interface DigitalHandshakeResult {
  success: boolean
  proofOfDeliveryId: string
  blockchainTransactionId?: string
  verificationScore: number
  timestamp: Date
  errors?: string[]
  warnings?: string[]
}

export interface BlockchainRecord {
  transactionId: string
  blockHash: string
  previousHash: string
  timestamp: Date
  data: any
  validators: string[]
  consensus: boolean
}

export interface ProofOfDelivery {
  id: string
  shipmentId: string
  deliveryPersonId: string
  recipientId?: string
  status: 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'CONFIRMED'
  deliveryTimestamp: Date
  verificationMethods: string[]
  verificationScore: number
  blockchainRecord?: BlockchainRecord
  digitalEvidence: DigitalEvidence[]
  auditTrail: AuditRecord[]
}

export interface DigitalEvidence {
  type: 'nfc' | 'biometric' | 'photo' | 'signature' | 'geolocation' | 'timestamp'
  data: any
  hash: string
  timestamp: Date
  verified: boolean
}

export interface AuditRecord {
  id: string
  action: string
  performedBy: string
  timestamp: Date
  details: any
  ipAddress?: string
  deviceInfo?: any
}

export class DigitalHandshakeService {
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm'
  private readonly HASH_ALGORITHM = 'sha256'
  private readonly BLOCKCHAIN_NETWORK = 'supply-chain-net'

  /**
   * Process a complete digital handshake for proof of delivery
   */
  async processDigitalHandshake(request: DigitalHandshakeRequest): Promise<DigitalHandshakeResult> {
    try {
      // 1. Validate the handshake request
      const validation = await this.validateHandshakeRequest(request)
      if (!validation.isValid) {
        return {
          success: false,
          proofOfDeliveryId: '',
          verificationScore: 0,
          timestamp: new Date(),
          errors: validation.errors
        }
      }

      // 2. Verify NFC data integrity
      const nfcVerification = await this.verifyNFCData(request.nfcData)
      if (!nfcVerification.isValid) {
        return {
          success: false,
          proofOfDeliveryId: '',
          verificationScore: 0,
          timestamp: new Date(),
          errors: ['NFC data verification failed']
        }
      }

      // 3. Process biometric verification if provided
      let biometricScore = 0
      if (request.biometricData) {
        const biometricResult = await this.processBiometricVerification(request.biometricData)
        biometricScore = biometricResult.confidence
      }

      // 4. Verify geolocation
      const locationVerification = await this.verifyDeliveryLocation(
        request.shipmentId,
        request.deliveryLocation
      )

      // 5. Calculate overall verification score
      const verificationScore = this.calculateVerificationScore({
        nfcScore: nfcVerification.score,
        biometricScore,
        locationScore: locationVerification.score,
        hasAdditionalVerification: !!request.additionalVerification
      })

      // 6. Create proof of delivery record
      const proofOfDelivery = await this.createProofOfDelivery(request, verificationScore)

      // 7. Record on blockchain if verification score is sufficient
      let blockchainRecord: BlockchainRecord | undefined
      if (verificationScore >= 85) {
        blockchainRecord = await this.recordOnBlockchain(proofOfDelivery)
      }

      // 8. Update shipment status
      await this.updateShipmentStatus(request.shipmentId, proofOfDelivery.id)

      // 9. Send notifications
      await this.sendDeliveryNotifications(request.shipmentId, proofOfDelivery)

      return {
        success: true,
        proofOfDeliveryId: proofOfDelivery.id,
        blockchainTransactionId: blockchainRecord?.transactionId,
        verificationScore,
        timestamp: new Date(),
        warnings: verificationScore < 85 ? ['Verification score below blockchain threshold'] : undefined
      }

    } catch (error) {
      console.error('Digital handshake processing error:', error)
      return {
        success: false,
        proofOfDeliveryId: '',
        verificationScore: 0,
        timestamp: new Date(),
        errors: ['System error during handshake processing']
      }
    }
  }

  /**
   * Validate the handshake request parameters
   */
  private async validateHandshakeRequest(request: DigitalHandshakeRequest): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Check if shipment exists and is deliverable
    const shipment = await prisma.shipment.findUnique({
      where: { id: request.shipmentId },
      include: { order: true }
    })

    if (!shipment) {
      errors.push('Shipment not found')
      return { isValid: false, errors }
    }

    if (!['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(shipment.status)) {
      errors.push('Shipment not ready for delivery')
    }

    // Validate delivery person
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: request.deliveryPersonId },
      select: { id: true, isActive: true, role: true }
    })

    if (!deliveryPerson || !deliveryPerson.isActive) {
      errors.push('Invalid delivery person')
    }

    if (deliveryPerson && !['DRIVER', 'WAREHOUSE_WORKER'].includes(deliveryPerson.role)) {
      errors.push('Delivery person not authorized for deliveries')
    }

    // Validate NFC data structure
    if (!request.nfcData.deviceId || !request.nfcData.tagId || !request.nfcData.encryptedPayload) {
      errors.push('Incomplete NFC data')
    }

    // Validate location data
    if (!request.deliveryLocation.latitude || !request.deliveryLocation.longitude) {
      errors.push('Invalid delivery location coordinates')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Verify NFC data integrity and authenticity
   */
  private async verifyNFCData(nfcData: NFCHandshakeData): Promise<{
    isValid: boolean
    score: number
    details: any
  }> {
    try {
      // 1. Verify device exists and is authorized
      const device = await prisma.nFCDevice.findUnique({
        where: { deviceId: nfcData.deviceId },
        select: { isActive: true, capabilities: true, type: true }
      })

      if (!device || !device.isActive) {
        return { isValid: false, score: 0, details: { error: 'Device not authorized' } }
      }

      // 2. Verify tag exists and is valid
      const tag = await prisma.nFCTag.findUnique({
        where: { tagId: nfcData.tagId },
        select: { isActive: true, expiresAt: true, data: true }
      })

      if (!tag || !tag.isActive) {
        return { isValid: false, score: 0, details: { error: 'Invalid or expired tag' } }
      }

      if (tag.expiresAt && tag.expiresAt < new Date()) {
        return { isValid: false, score: 0, details: { error: 'Tag expired' } }
      }

      // 3. Verify signature
      const signatureValid = this.verifySignature(
        nfcData.encryptedPayload,
        nfcData.signature,
        nfcData.deviceId
      )

      if (!signatureValid) {
        return { isValid: false, score: 0, details: { error: 'Invalid signature' } }
      }

      // 4. Decrypt and validate payload
      const decryptedPayload = this.decryptPayload(nfcData.encryptedPayload, nfcData.tagId)
      const payloadValid = this.validatePayload(decryptedPayload)

      if (!payloadValid) {
        return { isValid: false, score: 0, details: { error: 'Invalid payload' } }
      }

      // 5. Check timestamp freshness (within last 5 minutes)
      const timeDiff = Date.now() - nfcData.timestamp.getTime()
      const isFresh = timeDiff < 5 * 60 * 1000

      // Calculate score based on verification factors
      let score = 70 // Base score for valid NFC
      if (isFresh) score += 15
      if (device.type === 'FIXED_READER') score += 10 // Higher trust for fixed readers
      if (nfcData.deviceCapabilities.includes('encrypt')) score += 5

      return {
        isValid: true,
        score: Math.min(100, score),
        details: {
          deviceType: device.type,
          signatureValid,
          payloadValid,
          timestampFresh: isFresh
        }
      }

    } catch (error) {
      console.error('NFC verification error:', error)
      return { isValid: false, score: 0, details: { error: 'Verification failed' } }
    }
  }

  /**
   * Process biometric verification
   */
  private async processBiometricVerification(biometricData: BiometricData): Promise<{
    confidence: number
    verified: boolean
    details: any
  }> {
    try {
      // In a real implementation, this would integrate with biometric verification APIs
      // For now, we'll simulate the verification process

      const baseConfidence = biometricData.confidence
      let adjustedConfidence = baseConfidence

      // Adjust confidence based on biometric type
      switch (biometricData.type) {
        case 'fingerprint':
          adjustedConfidence = Math.min(95, baseConfidence + 5)
          break
        case 'face':
          adjustedConfidence = Math.min(90, baseConfidence)
          break
        case 'voice':
          adjustedConfidence = Math.min(85, baseConfidence - 5)
          break
        case 'signature':
          adjustedConfidence = Math.min(80, baseConfidence - 10)
          break
      }

      // Check if timestamp is recent (within last minute)
      const timeDiff = Date.now() - biometricData.timestamp.getTime()
      const isRecent = timeDiff < 60 * 1000

      if (!isRecent) {
        adjustedConfidence -= 10
      }

      const verified = adjustedConfidence >= 70

      return {
        confidence: Math.max(0, adjustedConfidence),
        verified,
        details: {
          type: biometricData.type,
          originalConfidence: baseConfidence,
          adjustedConfidence,
          timestampRecent: isRecent
        }
      }

    } catch (error) {
      console.error('Biometric verification error:', error)
      return {
        confidence: 0,
        verified: false,
        details: { error: 'Biometric verification failed' }
      }
    }
  }

  /**
   * Verify delivery location against expected destination
   */
  private async verifyDeliveryLocation(
    shipmentId: string,
    deliveryLocation: DigitalHandshakeRequest['deliveryLocation']
  ): Promise<{ score: number; details: any }> {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        select: { destination: true }
      })

      if (!shipment?.destination) {
        return { score: 0, details: { error: 'No destination found' } }
      }

      const expectedDestination = shipment.destination as any
      
      // Calculate distance between delivered location and expected destination
      const distance = this.calculateDistance(
        deliveryLocation.latitude,
        deliveryLocation.longitude,
        expectedDestination.latitude || 0,
        expectedDestination.longitude || 0
      )

      // Score based on proximity
      let score = 100
      if (distance > 0.1) score = 90 // Within 100m
      if (distance > 0.5) score = 75 // Within 500m
      if (distance > 1.0) score = 50 // Within 1km
      if (distance > 5.0) score = 20 // Within 5km
      if (distance > 10.0) score = 0 // More than 10km

      return {
        score,
        details: {
          distanceKm: distance,
          expectedLocation: expectedDestination,
          actualLocation: deliveryLocation,
          withinAcceptableRange: distance <= 1.0
        }
      }

    } catch (error) {
      console.error('Location verification error:', error)
      return { score: 0, details: { error: 'Location verification failed' } }
    }
  }

  /**
   * Calculate verification score based on all factors
   */
  private calculateVerificationScore(factors: {
    nfcScore: number
    biometricScore: number
    locationScore: number
    hasAdditionalVerification: boolean
  }): number {
    const weights = {
      nfc: 0.4,      // 40% weight for NFC verification
      biometric: 0.3, // 30% weight for biometric verification
      location: 0.2,  // 20% weight for location verification
      additional: 0.1 // 10% weight for additional verification
    }

    let totalScore = 
      factors.nfcScore * weights.nfc +
      factors.biometricScore * weights.biometric +
      factors.locationScore * weights.location

    if (factors.hasAdditionalVerification) {
      totalScore += 10 * weights.additional
    }

    return Math.min(100, Math.round(totalScore))
  }

  /**
   * Create proof of delivery record
   */
  private async createProofOfDelivery(
    request: DigitalHandshakeRequest,
    verificationScore: number
  ): Promise<ProofOfDelivery> {
    const proofId = `POD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create digital evidence
    const digitalEvidence: DigitalEvidence[] = [
      {
        type: 'nfc',
        data: request.nfcData,
        hash: this.generateHash(JSON.stringify(request.nfcData)),
        timestamp: request.nfcData.timestamp,
        verified: true
      },
      {
        type: 'geolocation',
        data: request.deliveryLocation,
        hash: this.generateHash(JSON.stringify(request.deliveryLocation)),
        timestamp: request.deliveryLocation.timestamp,
        verified: true
      },
      {
        type: 'timestamp',
        data: { deliveryTime: new Date() },
        hash: this.generateHash(new Date().toISOString()),
        timestamp: new Date(),
        verified: true
      }
    ]

    if (request.biometricData) {
      digitalEvidence.push({
        type: 'biometric',
        data: request.biometricData,
        hash: this.generateHash(JSON.stringify(request.biometricData)),
        timestamp: request.biometricData.timestamp,
        verified: true
      })
    }

    if (request.additionalVerification?.photoProof) {
      digitalEvidence.push({
        type: 'photo',
        data: { photoProof: request.additionalVerification.photoProof },
        hash: this.generateHash(request.additionalVerification.photoProof),
        timestamp: new Date(),
        verified: true
      })
    }

    // Create audit trail
    const auditTrail: AuditRecord[] = [
      {
        id: `AUDIT-${Date.now()}`,
        action: 'PROOF_OF_DELIVERY_CREATED',
        performedBy: request.deliveryPersonId,
        timestamp: new Date(),
        details: {
          shipmentId: request.shipmentId,
          verificationScore,
          evidenceCount: digitalEvidence.length
        }
      }
    ]

    const proofOfDelivery: ProofOfDelivery = {
      id: proofId,
      shipmentId: request.shipmentId,
      deliveryPersonId: request.deliveryPersonId,
      recipientId: request.recipientId,
      status: verificationScore >= 85 ? 'VERIFIED' : 'PENDING',
      deliveryTimestamp: new Date(),
      verificationMethods: this.extractVerificationMethods(request),
      verificationScore,
      digitalEvidence,
      auditTrail
    }

    // Store in database
    await this.storeProofOfDelivery(proofOfDelivery)

    return proofOfDelivery
  }

  /**
   * Record proof of delivery on blockchain
   */
  private async recordOnBlockchain(proofOfDelivery: ProofOfDelivery): Promise<BlockchainRecord> {
    try {
      // In a real implementation, this would interface with an actual blockchain
      // For now, we'll simulate the blockchain recording process

      const transactionData = {
        proofOfDeliveryId: proofOfDelivery.id,
        shipmentId: proofOfDelivery.shipmentId,
        timestamp: proofOfDelivery.deliveryTimestamp,
        verificationScore: proofOfDelivery.verificationScore,
        evidenceHashes: proofOfDelivery.digitalEvidence.map(e => e.hash)
      }

      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const blockHash = this.generateHash(JSON.stringify(transactionData))
      const previousHash = await this.getLastBlockHash()

      const blockchainRecord: BlockchainRecord = {
        transactionId,
        blockHash,
        previousHash,
        timestamp: new Date(),
        data: transactionData,
        validators: ['validator-1', 'validator-2', 'validator-3'],
        consensus: true
      }

      // Simulate blockchain network delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Store blockchain record
      await this.storeBlockchainRecord(blockchainRecord)

      return blockchainRecord

    } catch (error) {
      console.error('Blockchain recording error:', error)
      throw new Error('Failed to record on blockchain')
    }
  }

  /**
   * Helper methods
   */
  private verifySignature(payload: string, signature: string, deviceId: string): boolean {
    // In a real implementation, this would verify the cryptographic signature
    // For now, we'll simulate signature verification
    return signature.length > 0 && deviceId.length > 0
  }

  private decryptPayload(encryptedPayload: string, key: string): any {
    // In a real implementation, this would decrypt the payload
    // For now, we'll simulate decryption
    try {
      return JSON.parse(Buffer.from(encryptedPayload, 'base64').toString())
    } catch {
      return null
    }
  }

  private validatePayload(payload: any): boolean {
    return payload && typeof payload === 'object'
  }

  private generateHash(data: string): string {
    return crypto.createHash(this.HASH_ALGORITHM).update(data).digest('hex')
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private extractVerificationMethods(request: DigitalHandshakeRequest): string[] {
    const methods = ['nfc', 'geolocation', 'timestamp']
    
    if (request.biometricData) {
      methods.push(`biometric_${request.biometricData.type}`)
    }
    
    if (request.additionalVerification?.photoProof) {
      methods.push('photo_proof')
    }
    
    if (request.additionalVerification?.customerSignature) {
      methods.push('customer_signature')
    }
    
    if (request.additionalVerification?.otp) {
      methods.push('otp')
    }
    
    return methods
  }

  private async updateShipmentStatus(shipmentId: string, proofOfDeliveryId: string): Promise<void> {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'DELIVERED',
        actualDelivery: new Date(),
        metadata: {
          proofOfDeliveryId,
          deliveredViaDigitalHandshake: true
        }
      }
    })
  }

  private async sendDeliveryNotifications(shipmentId: string, proofOfDelivery: ProofOfDelivery): Promise<void> {
    // In a real implementation, this would send notifications via various channels
    console.log(`Sending delivery notifications for shipment ${shipmentId}`)
  }

  private async storeProofOfDelivery(proofOfDelivery: ProofOfDelivery): Promise<void> {
    // Store in database - in a real implementation, this would use proper Prisma schema
    console.log(`Storing proof of delivery: ${proofOfDelivery.id}`)
  }

  private async storeBlockchainRecord(record: BlockchainRecord): Promise<void> {
    // Store blockchain record - in a real implementation, this would use proper storage
    console.log(`Storing blockchain record: ${record.transactionId}`)
  }

  private async getLastBlockHash(): Promise<string> {
    // Get the last block hash from blockchain
    return 'previous-block-hash-placeholder'
  }
}

export default DigitalHandshakeService 