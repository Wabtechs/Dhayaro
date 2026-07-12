from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

connect_args = {}
db_url = settings.DATABASE_URL
if "neon.tech" in db_url:
    connect_args["ssl"] = "require"
    db_url = db_url.split("?")[0]

engine = create_async_engine(
    db_url,
    echo=False,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    connect_args=connect_args,
)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
