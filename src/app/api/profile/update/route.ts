import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error
    const userId = auth.userId

    const body = await request.json()
    const { name, phone } = body

    // Validate
    if (!name && !phone) {
      return NextResponse.json(
        { error: 'At least one field (name or phone) is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name) {
      if (name.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
      }
      updateData.name = name
    }
    if (phone) {
      // Check phone uniqueness
      const existing = await db.user.findUnique({ where: { phone } })
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 })
      }
      updateData.phone = phone
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
