import { ipcMain, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import log from 'electron-log'

export function setupFileIPC() {
  ipcMain.handle('file:list', async (_, dirPath: string) => {
    try {
      const normalizedPath = path.normalize(dirPath)
      const items = await fs.promises.readdir(normalizedPath, { withFileTypes: true })
      
      const fileItems = await Promise.all(
        items.map(async (item) => {
          const fullPath = path.join(normalizedPath, item.name)
          let stats
          
          try {
            stats = await fs.promises.stat(fullPath)
          } catch (err) {
            log.warn(`无法获取文件状态: ${fullPath}`, err)
            return null
          }
          
          return {
            name: item.name,
            path: fullPath,
            isDirectory: item.isDirectory(),
            size: stats.size,
            modifiedTime: stats.mtime.toISOString(),
            type: item.isDirectory() ? 'folder' : path.extname(item.name).toLowerCase() || 'file'
          }
        })
      )
      
      const fileItemsFiltered = fileItems.filter((item): item is {
        name: string
        path: string
        isDirectory: boolean
        size: number
        modifiedTime: string
        type: string
      } => item !== null)

      return fileItemsFiltered.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      log.error('读取目录失败:', error)
      throw error
    }
  })

  ipcMain.handle('file:copy', async (_, src: string, dest: string) => {
    try {
      const srcStats = await fs.promises.stat(src)
      
      if (srcStats.isDirectory()) {
        await copyDirectory(src, dest)
      } else {
        await fs.promises.copyFile(src, dest)
      }
      
      log.info(`文件复制成功: ${src} -> ${dest}`)
    } catch (error) {
      log.error('复制文件失败:', error)
      throw error
    }
  })

  ipcMain.handle('file:move', async (_, src: string, dest: string) => {
    try {
      await fs.promises.rename(src, dest)
      log.info(`文件移动成功: ${src} -> ${dest}`)
    } catch (error) {
      log.error('移动文件失败:', error)
      throw error
    }
  })

  ipcMain.handle('file:delete', async (_, targetPath: string) => {
    try {
      const stats = await fs.promises.stat(targetPath)
      
      if (stats.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true })
      } else {
        await fs.promises.unlink(targetPath)
      }
      
      log.info(`文件删除成功: ${targetPath}`)
    } catch (error) {
      log.error('删除文件失败:', error)
      throw error
    }
  })

  ipcMain.handle('file:rename', async (_, oldPath: string, newName: string) => {
    try {
      const dir = path.dirname(oldPath)
      const newPath = path.join(dir, newName)
      await fs.promises.rename(oldPath, newPath)
      log.info(`文件重命名成功: ${oldPath} -> ${newPath}`)
    } catch (error) {
      log.error('重命名文件失败:', error)
      throw error
    }
  })

  ipcMain.handle('file:open', async (_, targetPath: string) => {
    try {
      await shell.openPath(targetPath)
      log.info(`打开文件: ${targetPath}`)
    } catch (error) {
      log.error('打开文件失败:', error)
      throw error
    }
  })

  ipcMain.handle('file:createFolder', async (_, parentPath: string, folderName: string) => {
    try {
      const newFolderPath = path.join(parentPath, folderName)
      await fs.promises.mkdir(newFolderPath, { recursive: true })
      log.info(`创建文件夹成功: ${newFolderPath}`)
    } catch (error) {
      log.error('创建文件夹失败:', error)
      throw error
    }
  })

  ipcMain.handle('shell:openPath', async (_, targetPath: string) => {
    try {
      await shell.openPath(targetPath)
    } catch (error) {
      log.error('打开路径失败:', error)
      throw error
    }
  })
}

async function copyDirectory(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true })
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}
