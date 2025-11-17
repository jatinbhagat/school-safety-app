import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Simulate demo setup
    // In a real implementation, this would:
    // 1. Load demo school data into the database
    // 2. Create sample incidents
    // 3. Initialize demo state

    const demoData = {
      schoolId: 'demo-school-001',
      schoolSlug: 'demo-school',
      schoolName: 'Demo High School',
      incidentsCreated: 3,
      timestamp: new Date().toISOString(),
    };

    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Demo environment initialized successfully',
      data: demoData,
    });
  } catch (error) {
    console.error('Error initializing demo:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize demo environment',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Demo runner API. Use POST to initialize demo environment.',
  });
}
