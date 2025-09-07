import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { directMessageId: string } }
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const conversationId = searchParams.get("conversationId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse("Conversation ID missing", { status: 400 });
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          {
            memberOne: {
              profileId: profile.id,
            }
          },
          {
            memberTwo: {
              profileId: profile.id,
            }
          }
        ]
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          }
        },
        memberTwo: {
          include: {
            profile: true,
          }
        }
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    let directMessage = await db.directMessage.findFirst({
      where: {
        id: params.directMessageId,
        conversationId: conversationId,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      }
    });

    if (!directMessage || directMessage.deleted) {
      return new NextResponse("Message not found", { status: 404 });
    }

    const isMessageOwner = directMessage.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    directMessage = await db.directMessage.update({
      where: {
        id: params.directMessageId,
      },
      data: {
        fileUrl: null,
        content: "This message has been deleted.",
        deleted: true,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      }
    });

    return NextResponse.json(directMessage);
  } catch (error) {
    console.log("[DIRECT_MESSAGE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { directMessageId: string } }
) {
  try {
    const profile = await currentProfile();
    const { content } = await req.json();
    const { searchParams } = new URL(req.url);

    const conversationId = searchParams.get("conversationId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse("Conversation ID missing", { status: 400 });
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          {
            memberOne: {
              profileId: profile.id,
            }
          },
          {
            memberTwo: {
              profileId: profile.id,
            }
          }
        ]
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          }
        },
        memberTwo: {
          include: {
            profile: true,
          }
        }
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    let directMessage = await db.directMessage.findFirst({
      where: {
        id: params.directMessageId,
        conversationId: conversationId,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      }
    });

    if (!directMessage || directMessage.deleted) {
      return new NextResponse("Message not found", { status: 404 });
    }

    const isMessageOwner = directMessage.memberId === member.id;

    if (!isMessageOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    directMessage = await db.directMessage.update({
      where: {
        id: params.directMessageId,
      },
      data: {
        content,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      }
    });

    return NextResponse.json(directMessage);
  } catch (error) {
    console.log("[DIRECT_MESSAGE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}